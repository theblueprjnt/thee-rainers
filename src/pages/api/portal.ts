export const prerender = false;

import Stripe from 'stripe';
import { env as cfEnv } from 'cloudflare:workers';

export async function POST({ request }: { request: Request }): Promise<Response> {
  const e = cfEnv as unknown as Record<string, string>;
  const siteUrl = e['SITE_URL'] ?? 'https://theerainers.com';
  const headers = { 'Content-Type': 'application/json' };

  try {
    const { customerId } = await request.json() as { customerId: string };
    if (!customerId) {
      return new Response(JSON.stringify({ error: 'missing customerId' }), { status: 400, headers });
    }
    const stripe = new Stripe(e['STRIPE_SECRET_KEY'] ?? '', { httpClient: Stripe.createFetchHttpClient() });
    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: `${siteUrl}/account`,
    });
    return new Response(JSON.stringify({ url: session.url }), { headers });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return new Response(JSON.stringify({ error: msg }), { status: 500, headers });
  }
}
