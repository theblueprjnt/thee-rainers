export const prerender = false;

import type { APIContext } from 'astro';
import Stripe from 'stripe';
import { env as cfEnv } from 'cloudflare:workers';

const PRODUCT_MAP: Record<string, string> = {
  'prod_UZreHroYQEDAFU': 'bundle',
  'prod_UZrejf6iuDorEA': 'footwork',
  'prod_UZreDlek9325EY': 'shadowboxing',
};

function generateToken(): string {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
}

export async function POST({ request }: APIContext): Promise<Response> {
  const e = cfEnv as unknown as Record<string, string>;
  const webhookSecret = e['STRIPE_WEBHOOK_SECRET'] ?? '';
  const stripeKey     = e['STRIPE_SECRET_KEY'] ?? '';
  const deliveryUrl   = e['MAKE_DELIVERY_WEBHOOK_URL'] ?? '';

  if (!webhookSecret || !stripeKey || !deliveryUrl) {
    console.error('[stripe-webhook] Missing env vars — STRIPE_WEBHOOK_SECRET:', !!webhookSecret, 'STRIPE_SECRET_KEY:', !!stripeKey, 'MAKE_DELIVERY_WEBHOOK_URL:', !!deliveryUrl);
    return new Response('Misconfigured', { status: 500 });
  }

  // Must read raw body before any other parsing — required for signature verification
  const rawBody   = await request.text();
  const sigHeader = request.headers.get('stripe-signature') ?? '';

  // Single Stripe instance used for both signature verification and listLineItems
  const stripe = new Stripe(stripeKey, {
    apiVersion: '2025-04-30.basil',
    httpClient: Stripe.createFetchHttpClient(),
  });

  // constructEventAsync uses Web Crypto (CF Workers compatible) — replaces custom HMAC impl
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

    const payload = {
      email,
      product_id:   productId,
      product_slug: PRODUCT_MAP[productId] ?? 'unknown',
      token,
    };

    console.log('[stripe-webhook] Delivering payload:', JSON.stringify({ ...payload, token: '[redacted]' }));

    try {
      const res = await fetch(deliveryUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error(`Make.com responded ${res.status}: ${await res.text()}`);
      console.log('[stripe-webhook] Delivery success');
    } catch (err) {
      console.error('[stripe-webhook] Delivery webhook error:', String(err));
      // Return 200 regardless — Stripe must not retry on downstream failures
    }
  }

  return new Response(JSON.stringify({ received: true }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
}
