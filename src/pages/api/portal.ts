export const prerender = false;

import Stripe from 'stripe';
import { env as cfEnv } from 'cloudflare:workers';

// Creates a Stripe Customer Portal session.
// Accepts POST with { session_id } to look up customer from a checkout session.
// Returns { url } — redirect the client to this URL.

export async function POST({ request }: { request: Request }): Promise<Response> {
  const e = cfEnv as unknown as Record<string, string>;
  const siteUrl = e['SITE_URL'] ?? 'https://theerainers.com';
  const headers = { 'Content-Type': 'application/json' };

  try {
    const body = await request.json() as { session_id?: string; customerId?: string };
    const stripe = new Stripe(e['STRIPE_SECRET_KEY'] ?? '', { httpClient: Stripe.createFetchHttpClient() });

    let customerId: string | null = null;

    if (body.session_id) {
      const session = await stripe.checkout.sessions.retrieve(body.session_id);
      customerId = typeof session.customer === 'string' ? session.customer : (session.customer as Stripe.Customer | null)?.id ?? null;
    } else if (body.customerId) {
      customerId = body.customerId;
    }

    if (!customerId) {
      return new Response(JSON.stringify({ error: 'customer not found' }), { status: 404, headers });
    }

    const portalSession = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: `${siteUrl}/community`,
    });

    return new Response(JSON.stringify({ url: portalSession.url }), { headers });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return new Response(JSON.stringify({ error: msg }), { status: 500, headers });
  }
}
