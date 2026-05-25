export const prerender = false;

import type { APIContext } from 'astro';
import Stripe from 'stripe';
import { env as cfEnv } from 'cloudflare:workers';

// ── product map ────────────────────────────────────────────────────────────
// Maps Stripe product IDs → internal slug.
const PRODUCT_MAP: Record<string, string> = {
  // One-time purchases
  'prod_UZreHroYQEDAFU': 'bundle',
  'prod_UZrejf6iuDorEA': 'footwork',
  'prod_UZreDlek9325EY': 'shadowboxing',
  'prod_UZOMBOeJ0mm15I': 'workshop-replay',

  // Membership — Paid Brotherhood ($47/mo or $470/yr)
  // Bundle is ONE subscription — never stacks footwork + shadowboxing (no double charge)
  'prod_UZ9lTK2PhsS4xs': 'footwork',      // Footwork Blueprint membership
  'prod_UZ9vV79TAun9yB': 'shadowboxing',   // Shadowboxing Blueprint membership
  'prod_UZ9xqJt3glrCOO': 'bundle',         // Bundle membership
};

// ── asset map ──────────────────────────────────────────────────────────────
// Slug → R2 object key(s). string[] so bundle delivers both files in one event.
// workshop-replay has no R2 asset — delivered via token-gated /watch/ page.
const ASSET_MAP: Record<string, string[]> = {
  'footwork':     ['thefootworkblueprint/links_theFOOTWORKBlueprint.pdf'],
  'shadowboxing': ['the shadowboxing blueprint/the shadowboxing blueprint.pdf'],
  'bundle':       [
    'bundle/thefootworkblueprint/links_theFOOTWORKBlueprint.pdf',
    'bundle/the shadowboxing blueprint/the shadowboxing blueprint.pdf',
  ],
};

const SEVEN_DAYS_SECONDS = 7 * 24 * 60 * 60;
const SITE_URL = 'https://theerainers.com';

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
  const k2 = await hmacBuf(k1, 'auto');
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

// Stateless signed URL for the on-site /watch/ page — no KV needed.
async function generateWatchUrl(secret: string, product: string): Promise<string> {
  const exp    = Math.floor(Date.now() / 1000) + SEVEN_DAYS_SECONDS;
  const sigBuf = await hmacBuf(new TextEncoder().encode(secret), `${product}:${exp}`);
  const sig    = Array.from(new Uint8Array(sigBuf)).map(b => b.toString(16).padStart(2, '0')).join('');
  return `${SITE_URL}/watch/${product}?sig=${sig}&exp=${exp}`;
}

// ── delivery ───────────────────────────────────────────────────────────────
// Shared between checkout.session.completed and invoice.payment_succeeded (renewals).

async function deliverProduct(
  email: string,
  productId: string,
  e: Record<string, string>,
): Promise<void> {
  const deliveryUrl = e['MAKE_DELIVERY_WEBHOOK_URL'] ?? '';
  if (!deliveryUrl) {
    console.warn('[stripe-webhook] MAKE_DELIVERY_WEBHOOK_URL not set — delivery skipped');
    return;
  }

  const token       = generateToken();
  const productSlug = PRODUCT_MAP[productId] ?? 'unknown';

  let expiringUrl: string | null  = null;
  let expiringUrl2: string | null = null;

  if (productSlug === 'workshop-replay') {
    const watchSecret = e['WATCH_TOKEN_SECRET'] ?? '';
    if (watchSecret) {
      try {
        expiringUrl = await generateWatchUrl(watchSecret, 'workshop-replay');
      } catch (err) {
        console.error('[stripe-webhook] Watch URL signing error:', String(err));
      }
    } else {
      console.warn('[stripe-webhook] WATCH_TOKEN_SECRET not set');
    }
  } else {
    const objectKeys = ASSET_MAP[productSlug] ?? [];
    const r2AccountId = e['R2_ACCOUNT_ID'] ?? '';
    const r2AccessKey = e['R2_ACCESS_KEY_ID'] ?? '';
    const r2SecretKey = e['R2_SECRET_ACCESS_KEY'] ?? '';
    const r2Bucket    = e['R2_BUCKET_NAME'] ?? '';
    const r2Ready     = r2AccountId && r2AccessKey && r2SecretKey && r2Bucket;

    if (r2Ready && objectKeys.length > 0) {
      try {
        expiringUrl = await generateR2PresignedUrl(
          r2AccountId, r2AccessKey, r2SecretKey, r2Bucket, objectKeys[0],
        );
        // Bundle: second file (shadowboxing blueprint)
        if (objectKeys[1]) {
          expiringUrl2 = await generateR2PresignedUrl(
            r2AccountId, r2AccessKey, r2SecretKey, r2Bucket, objectKeys[1],
          );
        }
      } catch (err) {
        console.error('[stripe-webhook] R2 presign error:', String(err));
      }
    } else {
      console.warn('[stripe-webhook] R2 skipped — env vars missing or no asset for slug:', productSlug);
    }
  }

  const payload: Record<string, string | null> = {
    email,
    product_id:    productId,
    product_slug:  productSlug,
    token,
    expiring_url:  expiringUrl,
    expiring_url_2: expiringUrl2, // only populated for bundle; null for all others
  };

  console.log('[stripe-webhook] Delivering:', JSON.stringify({
    ...payload,
    token: '[redacted]',
    expiring_url:   expiringUrl   ? '[url-generated]' : null,
    expiring_url_2: expiringUrl2  ? '[url-generated]' : null,
  }));

  try {
    const res = await fetch(deliveryUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error(`Make.com responded ${res.status}: ${await res.text()}`);
    console.log('[stripe-webhook] Delivery success for', productSlug);
  } catch (err) {
    console.error('[stripe-webhook] Delivery error:', String(err));
    // Do not re-throw — Stripe must receive 200 regardless of downstream failures
  }
}

// ── handler ────────────────────────────────────────────────────────────────

export async function POST({ request }: APIContext): Promise<Response> {
  const e = cfEnv as unknown as Record<string, string>;
  const webhookSecret = e['STRIPE_WEBHOOK_SECRET'] ?? '';
  const stripeKey     = e['STRIPE_SECRET_KEY'] ?? '';

  if (!webhookSecret || !stripeKey) {
    console.error('[stripe-webhook] Missing STRIPE_WEBHOOK_SECRET or STRIPE_SECRET_KEY');
    return new Response('Misconfigured', { status: 500 });
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

  // ── initial purchase (one-time or first subscription payment) ────────────
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session;
    const email   = session.customer_details?.email ?? session.customer_email ?? '';

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

    if (email && productId) {
      await deliverProduct(email, productId, e);
    }
  }

  // ── subscription renewal — regenerate fresh access links each billing cycle ──
  // billing_reason 'subscription_create' is skipped intentionally:
  // checkout.session.completed already handled the initial delivery above.
  if (event.type === 'invoice.payment_succeeded') {
    const invoice = event.data.object as Stripe.Invoice;

    if (invoice.billing_reason !== 'subscription_cycle') {
      return new Response(JSON.stringify({ received: true }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const email = invoice.customer_email ?? '';
    let productId = '';

    const subId = typeof invoice.subscription === 'string' ? invoice.subscription : null;
    if (subId) {
      try {
        const subscription = await stripe.subscriptions.retrieve(subId, {
          expand: ['items.data.price.product'],
        });
        const product = subscription.items.data[0]?.price?.product;
        if (product && typeof product === 'object' && 'id' in product) {
          productId = (product as Stripe.Product).id;
        }
      } catch (err) {
        console.error('[stripe-webhook] subscription retrieve error:', String(err));
      }
    }

    if (email && productId) {
      await deliverProduct(email, productId, e);
    }
  }

  return new Response(JSON.stringify({ received: true }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
}
