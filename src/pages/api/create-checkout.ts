export const prerender = false;

import Stripe from 'stripe';
import { env as cfEnv } from 'cloudflare:workers';

// ── Product catalog ───────────────────────────────────────────────────────
// Single source of truth for Stripe Checkout Sessions across the site.
// Buttons reference these by lookupKey via `data-checkout="footwork"` etc.
//
// IMPORTANT: optionalItems is the Stripe-native cross-sell that renders as
// "Add to your order" on the Checkout page. Each price ID must be a
// discounted one-time price created in Stripe Dashboard for that purpose.

interface ProductConfig {
  priceId: string;
  mode: 'payment' | 'subscription';
  successPath: string;
  cancelPath: string;
}

const PRODUCTS: Record<string, ProductConfig> = {
  footwork: {
    priceId: 'price_1',
    mode: 'payment',
    successPath: '/thank-you/footwork',
    cancelPath: '/foundation',
  },
  shadowboxing: {
    priceId: 'price_2',
    mode: 'payment',
    successPath: '/thank-you/shadowboxing',
    cancelPath: '/shadowboxing-blueprint',
  },
  bundle: {
    priceId: 'price_1U1jK2HzlarU775HwLKCIkWC',
    mode: 'payment',
    successPath: '/thank-you/bundle',
    cancelPath: '/shop',
  },
  defense_workshop_early: {
    priceId: 'price_6',
    mode: 'payment',
    successPath: '/thank-you/defense-workshop',
    cancelPath: '/defense-workshop',
  },
  defense_workshop_standard: {
    priceId: 'price_5',
    mode: 'payment',
    successPath: '/thank-you/defense-workshop',
    cancelPath: '/defense-workshop',
  },
  greatness_monthly: {
    priceId: 'price_1Tbn8WHzlarU775HMfmbxaJy',
    mode: 'subscription',
    successPath: '/welcome',
    cancelPath: '/community',
  },
  greatness_annual: {
    priceId: 'price_1Tbn93HzlarU775HrkAJ73Yf',
    mode: 'subscription',
    successPath: '/welcome',
    cancelPath: '/community',
  },
};

export async function POST({ request }: { request: Request }): Promise<Response> {
  const e = cfEnv as unknown as Record<string, string>;
  const siteUrl = e['SITE_URL'] ?? 'https://theerainers.com';
  const headers = { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': siteUrl };

  try {
    const { lookupKey, customerEmail } = await request.json() as { lookupKey: string; customerEmail?: string };
    const product = PRODUCTS[lookupKey];
    if (!product) {
      return new Response(JSON.stringify({ error: 'unknown lookupKey' }), { status: 400, headers });
    }

    const stripe = new Stripe(e['STRIPE_SECRET_KEY'] ?? '', { httpClient: Stripe.createFetchHttpClient() });

    const sessionParams: Stripe.Checkout.SessionCreateParams = {
      mode: product.mode,
      line_items: [{ price: product.priceId, quantity: 1 }],
      allow_promotion_codes: true,
      ...(customerEmail ? { customer_email: customerEmail } : {}),
      success_url: `${siteUrl}${product.successPath}?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${siteUrl}${product.cancelPath}`,
      metadata: { lookup_key: lookupKey },
    };

    if (product.mode === 'subscription') {
      sessionParams.subscription_data = { metadata: { lookup_key: lookupKey } };
    } else {
      sessionParams.payment_intent_data = { metadata: { lookup_key: lookupKey } };
    }

    const session = await stripe.checkout.sessions.create(sessionParams);

    return new Response(JSON.stringify({ url: session.url }), { headers });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('[create-checkout] error:', msg);
    return new Response(JSON.stringify({ error: msg }), { status: 500, headers });
  }
}

export async function OPTIONS(): Promise<Response> {
  const e = cfEnv as unknown as Record<string, string>;
  return new Response(null, {
    headers: {
      'Access-Control-Allow-Origin': e['SITE_URL'] ?? 'https://theerainers.com',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}
