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
  optionalItems?: string[];
}

const PRODUCTS: Record<string, ProductConfig> = {
  footwork: {
    priceId: 'price_1Ta1RaHzlarU775HzUj9mz2O',
    mode: 'payment',
    successPath: '/thank-you/footwork',
    cancelPath: '/footwork-blueprint',
    optionalItems: ['price_1TfksbHzlarU775HzesQ4tfS'], // Shadowboxing add-on $40
  },
  shadowboxing: {
    priceId: 'price_1Tb1DHHzlarU775HIzI4fY8r',
    mode: 'payment',
    successPath: '/thank-you/shadowboxing',
    cancelPath: '/shadowboxing-blueprint',
    optionalItems: ['price_1TfkrhHzlarU775HpW8Frpi9'], // Footwork add-on $40
  },
  bundle: {
    priceId: 'price_1Tb1E3HzlarU775HOWBmRYIZ',
    mode: 'payment',
    successPath: '/thank-you/bundle',
    cancelPath: '/bundle',
    optionalItems: ['price_1TfkuAHzlarU775HneEki2a2'], // Community 30-day trial $19
  },
  workshop_replay: {
    priceId: 'price_1Tb1ILHzlarU775H0NVAhRgb',
    mode: 'payment',
    successPath: '/thank-you/workshop-replay',
    cancelPath: '/workshop-replay',
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

    // Build session params. optional_items is typed loosely because the param
    // shape moves faster than the Stripe SDK TypeScript definitions.
    const sessionParams: Stripe.Checkout.SessionCreateParams = {
      mode: product.mode,
      line_items: [{ price: product.priceId, quantity: 1 }],
      phone_number_collection: { enabled: true },
      allow_promotion_codes: true,
      billing_address_collection: 'required',
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

    if (product.optionalItems && product.optionalItems.length > 0) {
      // Stripe Checkout cross-sells via optional_items. Buyer sees "Add to
      // your order" with toggle on the hosted Checkout page.
      (sessionParams as unknown as { optional_items: { price: string; quantity: number }[] }).optional_items =
        product.optionalItems.map(priceId => ({ price: priceId, quantity: 1 }));
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
