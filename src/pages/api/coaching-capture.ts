export const prerender = false;

import type { APIContext } from 'astro';
import { env as cfEnv } from 'cloudflare:workers';

export async function POST({ request }: APIContext): Promise<Response> {
  const webhookUrl = (cfEnv as unknown as Record<string, string>)['MAKE_LEAD_WEBHOOK_URL'] ?? '';

  let data: Record<string, unknown>;
  try {
    data = await request.json() as Record<string, unknown>;
  } catch {
    return new Response(JSON.stringify({ status: 'error', error: 'Invalid JSON' }), { status: 400 });
  }

  const emailLog = String(data.email ?? '').replace(/(.).*(@.*)/, '$1***$2');

  if (!/^https?:\/\//.test(webhookUrl)) {
    console.error('[coaching-capture] FATAL: MAKE_LEAD_WEBHOOK_URL missing or invalid', { emailLog });
    return new Response(JSON.stringify({ status: 'error', error: 'Server config error. Email rainers@theerainers.com.' }), { status: 500 });
  }

  console.log('[coaching-capture] submission', { emailLog });

  try {
    const res = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...data, source: 'coaching-capture' }),
    });
    if (!res.ok) throw new Error(`Webhook responded ${res.status}`);
    return new Response(JSON.stringify({ status: 'success' }), { status: 200 });
  } catch (err) {
    console.error('[coaching-capture] webhook delivery failed:', err);
    return new Response(JSON.stringify({ status: 'error' }), { status: 500 });
  }
}
