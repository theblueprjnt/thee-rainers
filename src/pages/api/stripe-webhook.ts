export const prerender = false;

import type { APIContext } from 'astro';
import Stripe from 'stripe';
import { env as cfEnv } from 'cloudflare:workers';

// ── product map ────────────────────────────────────────────────────────────
const PRODUCT_MAP: Record<string, string> = {
  'prod_UZreHroYQEDAFU': 'bundle',
  'prod_UZrejf6iuDorEA': 'footwork',
  'prod_UZreDlek9325EY': 'shadowboxing',
  'prod_UZOMBOeJ0mm15I': 'workshop-replay',
  'prod_UZ9lTK2PhsS4xs': 'footwork',
  'prod_UZ9vV79TAun9yB': 'shadowboxing',
  'prod_UZ9xqJt3glrCOO': 'bundle',
};

// ── asset map ──────────────────────────────────────────────────────────────
const ASSET_MAP: Record<string, string[]> = {
  'footwork':     ['thefootworkblueprint/links_theFOOTWORKBlueprint.pdf'],
  'shadowboxing': ['the shadowboxing blueprint/the shadowboxing blueprint.pdf'],
  'bundle':       [
    'bundle/thefootworkblueprint/links_theFOOTWORKBlueprint.pdf',
    'bundle/the shadowboxing blueprint/the shadowboxing blueprint.pdf',
  ],
};

// ── Kit tag IDs ────────────────────────────────────────────────────────────
// TODO: Create tags in Kit (Grow > Tags) and paste the numeric IDs below.
// Tag URL looks like: app.kit.com/tags/1234567 — the number is the ID.
const KIT_PRODUCT_TAGS: Record<string, string> = {
  'footwork':     '19807643',
  'shadowboxing': '19807641',
  'bundle':       '19807644',
};
const KIT_MEMBER_TAG = '19807647';

const SEVEN_DAYS_SECONDS = 7 * 24 * 60 * 60;
const SITE_URL = 'https://theerainers.com';

// ── Kit v4 helpers ─────────────────────────────────────────────────────────

async function kitSubscriberId(apiKey: string, email: string): Promise<string | null> {
  // find-or-create
  let res = await fetch('https://api.kit.com/v4/subscribers', {
    method: 'POST',
    headers: { 'X-Kit-Api-Key': apiKey, 'Content-Type': 'application/json' },
    body: JSON.stringify({ email_address: email }),
  });
  let data: Record<string, unknown> = await res.json().catch(() => ({}));
  const subObj = data?.subscriber as Record<string, unknown> | undefined;
  if (subObj?.id) return String(subObj.id);

  // fallback: look up by email
  res = await fetch(`https://api.kit.com/v4/subscribers?email_address=${encodeURIComponent(email)}`, {
    headers: { 'X-Kit-Api-Key': apiKey },
  });
  data = await res.json().catch(() => ({}));
  const subs = data?.subscribers as Array<Record<string, unknown>> | undefined;
  return subs?.[0]?.id ? String(subs[0].id) : null;
}

async function tagKit(apiKey: string, email: string, tagId: string): Promise<void> {
  if (!apiKey || tagId.startsWith('KIT_TAG_')) return; // placeholder — skip silently
  const id = await kitSubscriberId(apiKey, email);
  if (!id) return;
  await fetch(`https://api.kit.com/v4/tags/${tagId}/subscribers/${id}`, {
    method: 'POST',
    headers: { 'X-Kit-Api-Key': apiKey, 'Content-Type': 'application/json' },
    body: '{}',
  });
}

async function untagKit(apiKey: string, email: string, tagId: string): Promise<void> {
  if (!apiKey || tagId.startsWith('KIT_TAG_')) return;
  const id = await kitSubscriberId(apiKey, email);
  if (!id) return;
  await fetch(`https://api.kit.com/v4/tags/${tagId}/subscribers/${id}`, {
    method: 'DELETE',
    headers: { 'X-Kit-Api-Key': apiKey },
  });
}

// ── Airtable helpers ───────────────────────────────────────────────────────

async function upsertAirtable(
  token: string,
  baseId: string,
  table: string,
  fields: Record<string, string>,
): Promise<void> {
  if (!token || !baseId || !fields.Email) return;
  await fetch(`https://api.airtable.com/v0/${baseId}/${encodeURIComponent(table)}`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      performUpsert: { fieldsToMergeOn: ['Email'] },
      records: [{ fields }],
    }),
  });
}

// ── token ──────────────────────────────────────────────────────────────────

function generateToken(): string {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
}

// ── AWS SigV4 helpers ──────────────────────────────────────────────────────

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
  accountId: string, accessKey: string, secretKey: string, bucket: string, objectKey: string,
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

async function generateWatchUrl(secret: string, product: string): Promise<string> {
  const exp    = Math.floor(Date.now() / 1000) + SEVEN_DAYS_SECONDS;
  const sigBuf = await hmacBuf(new TextEncoder().encode(secret), `${product}:${exp}`);
  const sig    = Array.from(new Uint8Array(sigBuf)).map(b => b.toString(16).padStart(2, '0')).join('');
  return `${SITE_URL}/watch/${product}?sig=${sig}&exp=${exp}`;
}

// ── delivery ───────────────────────────────────────────────────────────────

async function deliverProduct(email: string, productId: string, e: Record<string, string>): Promise<void> {
  const deliveryUrl = e['MAKE_DELIVERY_WEBHOOK_URL'] ?? '';
  if (!deliveryUrl) { console.warn('[stripe-webhook] MAKE_DELIVERY_WEBHOOK_URL not set'); return; }

  const token       = generateToken();
  const productSlug = PRODUCT_MAP[productId] ?? 'unknown';
  let expiringUrl: string | null  = null;
  let expiringUrl2: string | null = null;

  if (productSlug === 'workshop-replay') {
    const watchSecret = e['WATCH_TOKEN_SECRET'] ?? '';
    if (watchSecret) {
      try { expiringUrl = await generateWatchUrl(watchSecret, 'workshop-replay'); }
      catch (err) { console.error('[stripe-webhook] Watch URL signing error:', String(err)); }
    }
  } else {
    const objectKeys = ASSET_MAP[productSlug] ?? [];
    const r2AccountId = e['R2_ACCOUNT_ID'] ?? '';
    const r2AccessKey = e['R2_ACCESS_KEY_ID'] ?? '';
    const r2SecretKey = e['R2_SECRET_ACCESS_KEY'] ?? '';
    const r2Bucket    = e['R2_BUCKET_NAME'] ?? '';
    if (r2AccountId && r2AccessKey && r2SecretKey && r2Bucket && objectKeys.length > 0) {
      try {
        expiringUrl = await generateR2PresignedUrl(r2AccountId, r2AccessKey, r2SecretKey, r2Bucket, objectKeys[0]);
        if (objectKeys[1]) {
          expiringUrl2 = await generateR2PresignedUrl(r2AccountId, r2AccessKey, r2SecretKey, r2Bucket, objectKeys[1]);
        }
      } catch (err) { console.error('[stripe-webhook] R2 presign error:', String(err)); }
    }
  }

  try {
    const res = await fetch(deliveryUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, product_id: productId, product_slug: productSlug, token, expiring_url: expiringUrl, expiring_url_2: expiringUrl2 }),
    });
    if (!res.ok) throw new Error(`Make.com responded ${res.status}`);
    console.log('[stripe-webhook] Delivery success for', productSlug);
  } catch (err) {
    console.error('[stripe-webhook] Delivery error:', String(err));
  }
}

// ── handler ────────────────────────────────────────────────────────────────

export async function POST({ request }: APIContext): Promise<Response> {
  const e = cfEnv as unknown as Record<string, string>;
  const webhookSecret = e['STRIPE_WEBHOOK_SECRET'] ?? '';
  const stripeKey     = e['STRIPE_SECRET_KEY'] ?? '';
  const kitKey        = e['KIT_API_KEY'] ?? '';
  const airtableToken = e['AIRTABLE_API_KEY'] ?? '';
  const airtableBase  = e['AIRTABLE_BASE_ID'] ?? '';
  const airtableTable = e['AIRTABLE_TABLE'] ?? 'Members';

  if (!webhookSecret || !stripeKey) {
    console.error('[stripe-webhook] Missing env vars');
    return new Response('Misconfigured', { status: 500 });
  }

  const rawBody   = await request.text();
  const sigHeader = request.headers.get('stripe-signature') ?? '';
  const webCrypto = Stripe.createSubtleCryptoProvider();

  const stripe = new Stripe(stripeKey, { apiVersion: '2025-04-30.basil', httpClient: Stripe.createFetchHttpClient() });

  let event: Stripe.Event;
  try {
    event = await stripe.webhooks.constructEventAsync(rawBody, sigHeader, webhookSecret, undefined, webCrypto);
  } catch (err) {
    console.warn('[stripe-webhook] Signature verification failed:', String(err));
    return new Response('Invalid signature', { status: 400 });
  }

  try {
    // ── initial purchase ────────────────────────────────────────────────────
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session;
      const email   = session.customer_details?.email ?? session.customer_email ?? '';

      let productId = '';
      try {
        const lineItems = await stripe.checkout.sessions.listLineItems(session.id, { expand: ['data.price.product'] });
        const product = lineItems.data[0]?.price?.product;
        if (product && typeof product === 'object' && 'id' in product) {
          productId = (product as Stripe.Product).id;
        }
      } catch (err) { console.error('[stripe-webhook] listLineItems error:', String(err)); }

      if (email && productId) {
        const slug = PRODUCT_MAP[productId];
        await deliverProduct(email, productId, e);
        // Sync member into Airtable + tag in Kit
        await upsertAirtable(airtableToken, airtableBase, airtableTable, {
          Email: email,
          Name: session.customer_details?.name ?? '',
          Status: 'active',
          Product: slug ?? productId,
          'Stripe Customer': String(session.customer ?? ''),
          'Stripe Subscription': String(session.subscription ?? ''),
        });
        if (slug && KIT_PRODUCT_TAGS[slug]) {
          await tagKit(kitKey, email, KIT_MEMBER_TAG);
          await tagKit(kitKey, email, KIT_PRODUCT_TAGS[slug]);
        }
      }
    }

    // ── subscription renewal ────────────────────────────────────────────────
    if (event.type === 'invoice.payment_succeeded') {
      const invoice = event.data.object as Stripe.Invoice;
      if (invoice.billing_reason !== 'subscription_cycle') {
        return new Response(JSON.stringify({ received: true }), { status: 200, headers: { 'Content-Type': 'application/json' } });
      }
      const email = invoice.customer_email ?? '';
      let productId = '';
      const subId = typeof invoice.subscription === 'string' ? invoice.subscription : null;
      if (subId) {
        try {
          const sub = await stripe.subscriptions.retrieve(subId, { expand: ['items.data.price.product'] });
          const product = sub.items.data[0]?.price?.product;
          if (product && typeof product === 'object' && 'id' in product) productId = (product as Stripe.Product).id;
        } catch (err) { console.error('[stripe-webhook] subscription retrieve error:', String(err)); }
      }
      if (email && productId) await deliverProduct(email, productId, e);
    }

    // ── subscription status changes ─────────────────────────────────────────
    if (event.type === 'customer.subscription.updated') {
      const sub = event.data.object as Stripe.Subscription;
      const customer = await stripe.customers.retrieve(String(sub.customer));
      const email = !customer.deleted ? customer.email ?? '' : '';
      const product = sub.items.data[0]?.price?.product;
      const productId = product && typeof product === 'object' && 'id' in product ? (product as Stripe.Product).id : String(product ?? '');
      const slug = PRODUCT_MAP[productId];
      await upsertAirtable(airtableToken, airtableBase, airtableTable, {
        Email: email,
        Status: sub.status,
        Product: slug ?? '',
        'Stripe Customer': String(sub.customer),
        'Stripe Subscription': sub.id,
      });
      if (email) {
        if (sub.status === 'active' || sub.status === 'trialing') {
          await tagKit(kitKey, email, KIT_MEMBER_TAG);
        } else {
          await untagKit(kitKey, email, KIT_MEMBER_TAG);
        }
      }
    }

    if (event.type === 'customer.subscription.deleted') {
      const sub = event.data.object as Stripe.Subscription;
      const customer = await stripe.customers.retrieve(String(sub.customer));
      const email = !customer.deleted ? customer.email ?? '' : '';
      await upsertAirtable(airtableToken, airtableBase, airtableTable, {
        Email: email,
        Status: 'canceled',
        'Stripe Customer': String(sub.customer),
        'Stripe Subscription': sub.id,
      });
      if (email) await untagKit(kitKey, email, KIT_MEMBER_TAG);
    }

  } catch (err) {
    console.error('[stripe-webhook] handler error:', String(err));
    // Always 200 — never let downstream failures trigger Stripe retries
  }

  return new Response(JSON.stringify({ received: true }), { status: 200, headers: { 'Content-Type': 'application/json' } });
}
