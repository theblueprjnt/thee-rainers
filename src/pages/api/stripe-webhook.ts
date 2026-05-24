export const prerender = false;

import type { APIContext } from 'astro';

// Verify Stripe webhook signature using Web Crypto API (Cloudflare Workers compatible)
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

  // Reject events older than 5 minutes
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

  // Constant-time comparison
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
  const secret = import.meta.env.STRIPE_WEBHOOK_SECRET ?? '';
  const deliveryUrl = import.meta.env.MAKE_DELIVERY_WEBHOOK_URL ?? '';

  if (!secret || !deliveryUrl) {
    console.error('[stripe-webhook] Missing STRIPE_WEBHOOK_SECRET or MAKE_DELIVERY_WEBHOOK_URL');
    return new Response('Misconfigured', { status: 500 });
  }

  // Read raw body BEFORE any other parsing — required for signature verification
  const rawBody = await request.text();
  const sigHeader = request.headers.get('stripe-signature') ?? '';

  const valid = await verifyStripeSignature(rawBody, sigHeader, secret);
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
    const email = details?.email ?? (session.customer_email as string) ?? '';
    const token = generateToken();

    const payload = {
      email,
      access_token: token,
      amount_cents: session.amount_total,
      payment_link: session.payment_link ?? null,
      session_id: session.id,
      access_url: `https://theerainers.com/private-architecture/${token}`,
      created_at: new Date().toISOString(),
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
      // Do not return an error — Stripe must receive 200 to stop retrying
    }
  }

  return new Response(JSON.stringify({ received: true }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
}
