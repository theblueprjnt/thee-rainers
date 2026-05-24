export const prerender = false;

import type { APIContext } from 'astro';
import Stripe from 'stripe';

// Product ID → slug map
const PRODUCT_MAP: Record<string, string> = {
  'prod_UZreHroYQEDAFU': 'bundle',
  'prod_UZrejf6iuDorEA': 'footwork',
  'prod_UZreDlek9325EY': 'shadowboxing',
};

async function verifyStripeSignature(
  rawBody: string,
  header: string,
  secret: string,
): Promise<boolean> {
  const parts: Record<string, string> = {};
  for (const chunk of header.split(',')) {
    const eq = chunk.indexOf('=');
    if (eq > 0) parts[chunk.slice(0, eq).trim()] = chunk.slice(eq + 1).trim();
  }
  const ts = parts['t'];
  const sig = parts['v1'];
  if (!ts || !sig) return false;

  if (Math.abs(Date.now() / 1000 - Number(ts)) > 300) return false;

  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    enc.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const mac = await crypto.subtle.sign('HMAC', key, enc.encode(`${ts}.${rawBody}`));
  const computed = Array.from(new Uint8Array(mac))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');

  if (computed.length !== sig.length) return false;
  let diff = 0;
  for (let i = 0; i < computed.length; i++) {
    diff |= computed.charCodeAt(i) ^ sig.charCodeAt(i);
  }
  return diff === 0;
}

function generateToken(): string {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
}

export async function POST({ request }: APIContext): Promise<Response> {
  const webhookSecret = import.meta.env.STRIPE_WEBHOOK_SECRET ?? '';
  const stripeKey     = import.meta.env.STRIPE_SECRET_KEY ?? '';
  const deliveryUrl   = import.meta.env.MAKE_DELIVERY_WEBHOOK_URL ?? '';

  if (!webhookSecret || !stripeKey || !deliveryUrl) {
    console.error('[stripe-webhook] Missing required env vars');
    return new Response('Misconfigured', { status: 500 });
  }

  const rawBody  = await request.text();
  const sigHeader = request.headers.get('stripe-signature') ?? '';

  const valid = await verifyStripeSignature(rawBody, sigHeader, webhookSecret);
  if (!valid) {
    console.warn('[stripe-webhook] Signature verification failed');
    return new Response('Invalid signature', { status: 400 });
  }

  let event: { type: string; data: { object: Record<string, unknown> } };
  try {
    event = JSON.parse(rawBody);
  } catch {
    return new Response('Invalid JSON', { status: 400 });
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    const details = session.customer_details as Record<string, string> | null;
    const email   = details?.email ?? (session.customer_email as string) ?? '';
    const token   = generateToken();

    // Extract product ID via Stripe SDK
    let productId = '';
    try {
      const stripe = new Stripe(stripeKey, {
        apiVersion: '2025-04-30.basil',
        httpClient: Stripe.createFetchHttpClient(),
      });
      const sessionId = session.id as string;
      const lineItems = await stripe.checkout.sessions.listLineItems(sessionId, { expand: ['data.price.product'] });
      const first = lineItems.data[0];
      const product = first?.price?.product;
      if (product && typeof product === 'object' && 'id' in product) {
        productId = (product as { id: string }).id;
      }
    } catch (err) {
      console.error('[stripe-webhook] listLineItems error:', err);
    }

    const productSlug = PRODUCT_MAP[productId] ?? 'unknown';

    const payload = {
      email,
      product_id: productId,
      product_slug: productSlug,
      token,
    };

    try {
      const res = await fetch(deliveryUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error(`Make.com responded ${res.status}`);
    } catch (err) {
      console.error('[stripe-webhook] Delivery webhook error:', err);
      // Return 200 regardless — Stripe must not retry on our downstream failures
    }
  }

  return new Response(JSON.stringify({ received: true }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
}
