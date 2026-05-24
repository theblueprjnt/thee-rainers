export const prerender = false;

import type { APIContext } from 'astro';

export async function POST({ request }: APIContext): Promise<Response> {
  const webhookUrl = import.meta.env.MAKE_LEAD_WEBHOOK_URL ?? '';

  let data: Record<string, unknown>;
  try {
    data = await request.json() as Record<string, unknown>;
  } catch {
    return new Response(JSON.stringify({ status: 'error', error: 'Invalid JSON' }), { status: 400 });
  }

  if (!/^https?:\/\//.test(webhookUrl)) {
    console.warn('[coaching-capture] MAKE_LEAD_WEBHOOK_URL not set');
    return new Response(JSON.stringify({ status: 'success' }), { status: 200 });
  }

  try {
    const res = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...data, source: 'coaching-capture' }),
    });
    if (!res.ok) throw new Error(`Webhook responded ${res.status}`);
    return new Response(JSON.stringify({ status: 'success' }), { status: 200 });
  } catch (err) {
    console.error('[coaching-capture] webhook error:', err);
    return new Response(JSON.stringify({ status: 'error' }), { status: 500 });
  }
}
