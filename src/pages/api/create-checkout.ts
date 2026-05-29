export const prerender = false;

import Stripe from 'stripe';
import { env as cfEnv } from 'cloudflare:workers';

const PRICE_IDS: Record<string, string> = {
  greatness_monthly: 'price_1Tbn8WHzlarU775HMfmbxaJy',
  greatness_annual:  'price_1Tbn93HzlarU775HrkAJ73Yf',
};

export async function POST({ request }: { request: Request }): Promise<Response> {
  const e = cfEnv as unknown as Record<string, string>;
  const siteUrl = e['SITE_URL'] ?? 'https://theerainers.com';
  const headers = { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': siteUrl };

  try {
    const { lookupKey, customerEmail } = await request.json() as { lookupKey: string; customerEmail?: string };
    const priceId = PRICE_IDS[lookupKey];
    if (!priceId) {
      return new Response(JSON.stringify({ error: 'unknown lookupKey' }), { status: 400, headers });
    }

    const stripe = new Stripe(e['STRIPE_SECRET_KEY'] ?? '', { httpClient: Stripe.createFetchHttpClient() });

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      line_items: [{ price: priceId, quantity: 1 }],
      automatic_payment_methods: { enabled: true },
      phone_number_collection: { enabled: true },
      allow_promotion_codes: true,
      billing_address_collection: 'required',
      ...(customerEmail ? { customer_email: customerEmail } : {}),
      success_url: `${siteUrl}/welcome?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${siteUrl}/community`,
      metadata: { lookup_key: lookupKey },
      subscription_data: { metadata: { lookup_key: lookupKey } },
    });

    return new Response(JSON.stringify({ url: session.url }), { headers });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
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
