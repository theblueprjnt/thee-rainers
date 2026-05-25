export const prerender = false;

import type { APIContext } from 'astro';
import Stripe from 'stripe';
import { env as cfEnv } from 'cloudflare:workers';

// Stripe product ID → internal slug
const PRODUCT_MAP: Record<string, string> = {
  'prod_UZreHroYQEDAFU': 'bundle',
  'prod_UZrejf6iuDorEA': 'footwork',
  'prod_UZreDlek9325EY': 'shadowboxing',
  // Workshop Replay — add the prod_ ID from Stripe Dashboard → Products
  // 'prod_XXXXXXXXXXXX': 'workshop-replay',
};

// Slug → R2 object key (must match exact filenames uploaded to your bucket)
const ASSET_MAP: Record<string, string> = {
  'footwork':        'footwork-blueprint.pdf',
  'shadowboxing':    'shadowboxing-blueprint.pdf',
  'bundle':          'bundle.zip',
  'workshop-replay': 'workshop-replay.mp4',
};

const SEVEN_DAYS_SECONDS = 7 * 24 * 60 * 60;

// ── token ──────────────────────────────────────────────────────────────────

function generateToken(): string {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
}

// ── AWS SigV4 helpers (CF Workers native crypto — no AWS SDK needed) ───────

async function sha256hex(message: string): Promise<string> {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(message));
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
}

async function hmacBuf(key: ArrayBuffer | Uint8Array, msg: string): Promise<ArrayBuffer> {
  const k = await crypto.subtle.importKey(
    'raw', key, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'],
  );
  return crypto.subtle.sign('HMAC', k, new TextEncoder().encode(msg));
}

async function hmacHex(key: ArrayBuffer, msg: string): Promise<string> {
  const buf = await hmacBuf(key, msg);
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
}

async function r2SigningKey(secret: string, dateOnly: string): Promise<ArrayBuffer> {
  const k1 = await hmacBuf(new TextEncoder().encode('AWS4' + secret), dateOnly);
  const k2 = await hmacBuf(k1, 'auto');        // R2 region is always "auto"
  const k3 = await hmacBuf(k2, 's3');
  return hmacBuf(k3, 'aws4_request');
}

function buildCanonicalQS(params: [string, string][]): string {
  return [...params]
    .sort((a, b) => (a[0] < b[0] ? -1 : a[0] > b[0] ? 1 : 0))
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
    .join('&');
}

async function generateR2PresignedUrl(
  accountId: string,
  accessKey: string,
  secretKey: string,
  bucket: string,
  objectKey: string,
): Promise<string> {
  const now      = new Date();
  const dateStr  = now.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}Z$/, 'Z');
  const dateOnly = dateStr.slice(0, 8);

  const host       = `${bucket}.${accountId}.r2.cloudflarestorage.com`;
  const credential = `${accessKey}/${dateOnly}/auto/s3/aws4_request`;

  const queryParams: [string, string][] = [
    ['X-Amz-Algorithm',     'AWS4-HMAC-SHA256'],
    ['X-Amz-Credential',    credential],
    ['X-Amz-Date',          dateStr],
    ['X-Amz-Expires',       String(SEVEN_DAYS_SECONDS)],
    ['X-Amz-SignedHeaders', 'host'],
  ];

  const encodedKey       = objectKey.split('/').map(encodeURIComponent).join('/');
  const canonicalQS      = buildCanonicalQS(queryParams);
  const canonicalRequest = `GET\n/${encodedKey}\n${canonicalQS}\nhost:${host}\n\nhost\nUNSIGNED-PAYLOAD`;
  const scope            = `${dateOnly}/auto/s3/aws4_request`;
  const stringToSign     = `AWS4-HMAC-SHA256\n${dateStr}\n${scope}\n${await sha256hex(canonicalRequest)}`;
  const sigKey           = await r2SigningKey(secretKey, dateOnly);
  const signature        = await hmacHex(sigKey, stringToSign);

  return `https://${host}/${encodedKey}?${canonicalQS}&X-Amz-Signature=${signature}`;
}

// ── handler ────────────────────────────────────────────────────────────────

export async function POST({ request }: APIContext): Promise<Response> {
  const e = cfEnv as unknown as Record<string, string>;
  const webhookSecret = e['STRIPE_WEBHOOK_SECRET'] ?? '';
  const stripeKey     = e['STRIPE_SECRET_KEY'] ?? '';
  const deliveryUrl   = e['MAKE_DELIVERY_WEBHOOK_URL'] ?? '';
  const r2AccountId   = e['R2_ACCOUNT_ID'] ?? '';
  const r2AccessKey   = e['R2_ACCESS_KEY_ID'] ?? '';
  const r2SecretKey   = e['R2_SECRET_ACCESS_KEY'] ?? '';
  const r2Bucket      = e['R2_BUCKET_NAME'] ?? '';

  if (!webhookSecret || !stripeKey) {
    console.error('[stripe-webhook] Missing STRIPE_WEBHOOK_SECRET or STRIPE_SECRET_KEY');
    return new Response('Misconfigured', { status: 500 });
  }
  if (!deliveryUrl) {
    console.warn('[stripe-webhook] MAKE_DELIVERY_WEBHOOK_URL not set — purchases logged only');
  }

  const rawBody   = await request.text();
  const sigHeader = request.headers.get('stripe-signature') ?? '';

  const stripe = new Stripe(stripeKey, {
    apiVersion: '2025-04-30.basil',
    httpClient: Stripe.createFetchHttpClient(),
  });

  let event: Stripe.Event;
  try {
    event = await stripe.webhooks.constructEventAsync(rawBody, sigHeader, webhookSecret);
  } catch (err) {
    console.warn('[stripe-webhook] Signature verification failed:', String(err));
    return new Response('Invalid signature', { status: 400 });
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session;
    const email   = session.customer_details?.email ?? session.customer_email ?? '';
    const token   = generateToken();

    let productId = '';
    try {
      const lineItems = await stripe.checkout.sessions.listLineItems(session.id, {
        expand: ['data.price.product'],
      });
      const product = lineItems.data[0]?.price?.product;
      if (product && typeof product === 'object' && 'id' in product) {
        productId = (product as Stripe.Product).id;
      }
    } catch (err) {
      console.error('[stripe-webhook] listLineItems error:', String(err));
    }

    const productSlug = PRODUCT_MAP[productId] ?? 'unknown';
    const objectKey   = ASSET_MAP[productSlug];

    let expiringUrl: string | null = null;
    const r2Ready = r2AccountId && r2AccessKey && r2SecretKey && r2Bucket;

    if (objectKey && r2Ready) {
      try {
        expiringUrl = await generateR2PresignedUrl(
          r2AccountId, r2AccessKey, r2SecretKey, r2Bucket, objectKey,
        );
      } catch (err) {
        console.error('[stripe-webhook] R2 presign error:', String(err));
      }
    } else {
      console.warn('[stripe-webhook] R2 skipped — env vars missing or no asset for slug:', productSlug);
    }

    const payload = {
      email,
      product_id:   productId,
      product_slug: productSlug,
      token,
      expiring_url: expiringUrl,
    };

    console.log('[stripe-webhook] Delivering:', JSON.stringify({
      ...payload,
      token: '[redacted]',
      expiring_url: expiringUrl ? '[presigned-url-generated]' : null,
    }));

    if (deliveryUrl) {
      try {
        const res = await fetch(deliveryUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        if (!res.ok) throw new Error(`Make.com responded ${res.status}: ${await res.text()}`);
        console.log('[stripe-webhook] Delivery success');
      } catch (err) {
        console.error('[stripe-webhook] Delivery error:', String(err));
        // Always return 200 to Stripe — never let downstream failures cause retries
      }
    }
  }

  return new Response(JSON.stringify({ received: true }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
}
