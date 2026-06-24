export const prerender = false;
import { env as cfEnv } from 'cloudflare:workers';

export async function POST({ request }: { request: Request }) {
  const e = cfEnv as unknown as Record<string, string>;
  const webhookUrl = (e['MAKE_LEAD_WEBHOOK_URL'] ?? '').trim().replace(/^["']|["']$/g, '');

  let payload: Record<string, string> = {};
  try {
    payload = await request.json();
  } catch {
    return new Response(JSON.stringify({ ok: false }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const { url = '', referrer = '', timestamp = '' } = payload;

  if (webhookUrl) {
    fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ source: 'error-report', url, referrer, timestamp }),
    }).catch((err) => console.warn('[error-report] webhook failed:', err));
  }

  return new Response(JSON.stringify({ ok: true }), {
    headers: { 'Content-Type': 'application/json' },
  });
}
