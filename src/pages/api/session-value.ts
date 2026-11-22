// GET /api/session-value?session_id=...
//
// Task 12 (Meta Pixel) needs a Purchase value on every thank-you page.
// Every other purchase thank-you page has one fixed price per product, so
// the value is just a literal passed to window.__trbMetaPurchase(). Grade
// purchases are the one exception: /thank-you/coaching is shared by five
// different lookupKeys (grade1/2/3, grade2_plan, grade3_plan) at five
// different prices, and the page itself has no way to know which one a
// given visitor just bought. This endpoint is a narrow, read-only Stripe
// lookup to answer exactly that one question -- same
// stripe.checkout.sessions.retrieve() pattern already used by
// submit-clip.ts to verify a session, nothing new introduced.
//
// Read-only: never completes, modifies, or creates a charge. Returns only
// the amount actually paid (dollars) and currency -- no email, no name, no
// other PII -- so this is safe to call from the client with nothing but a
// session_id, which the visitor already has in their own URL.

export const prerender = false;

import type { APIContext } from 'astro';
import Stripe from 'stripe';
import { env as cfEnv } from 'cloudflare:workers';

function corsHeaders(origin: string): Record<string, string> {
  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Content-Type': 'application/json',
  };
}

export async function OPTIONS(): Promise<Response> {
  const origin = (cfEnv as unknown as Record<string, string>)['SITE_URL'] || 'https://theerainers.com';
  return new Response(null, { status: 204, headers: corsHeaders(origin) });
}

export async function GET({ request }: APIContext): Promise<Response> {
  const e = cfEnv as unknown as Record<string, string>;
  const origin = e['SITE_URL'] || 'https://theerainers.com';
  const headers = corsHeaders(origin);

  const sessionId = new URL(request.url).searchParams.get('session_id') ?? '';
  if (!sessionId) {
    return new Response(JSON.stringify({ error: 'missing session_id' }), { status: 400, headers });
  }

  const stripeKey = e['STRIPE_SECRET_KEY'] ?? '';
  if (!stripeKey) {
    return new Response(JSON.stringify({ error: 'unavailable' }), { status: 503, headers });
  }

  try {
    const stripe = new Stripe(stripeKey, { httpClient: Stripe.createFetchHttpClient() });
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    if (session.payment_status !== 'paid' || session.amount_total == null) {
      return new Response(JSON.stringify({ error: 'not paid' }), { status: 404, headers });
    }
    return new Response(JSON.stringify({
      value: session.amount_total / 100,
      currency: (session.currency ?? 'usd').toUpperCase(),
    }), { status: 200, headers });
  } catch (err) {
    console.error('[session-value] Stripe retrieve error:', String(err));
    return new Response(JSON.stringify({ error: 'lookup failed' }), { status: 500, headers });
  }
}
