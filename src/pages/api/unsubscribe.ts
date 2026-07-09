export const prerender = false;

import { env as cfEnv } from 'cloudflare:workers';

const SITE_URL = 'https://theerainers.com';

async function kitUnsubscribe(apiKey: string, email: string): Promise<void> {
  const lookupRes = await fetch(
    `https://api.kit.com/v4/subscribers?email_address=${encodeURIComponent(email)}`,
    { headers: { 'X-Kit-Api-Key': apiKey } },
  );
  if (!lookupRes.ok) {
    console.error('[unsubscribe] Kit lookup failed', lookupRes.status);
    return;
  }
  const data = await lookupRes.json().catch(() => ({})) as Record<string, unknown>;
  const subs = data?.subscribers as Array<Record<string, unknown>> | undefined;
  const subscriberId = subs?.[0]?.id ? String(subs[0].id) : null;
  if (!subscriberId) {
    console.log('[unsubscribe] No Kit subscriber found', email.replace(/(.).*(@.*)/, '$1***$2'));
    return;
  }
  const res = await fetch(`https://api.kit.com/v4/subscribers/${subscriberId}`, {
    method: 'PATCH',
    headers: { 'X-Kit-Api-Key': apiKey, 'Content-Type': 'application/json' },
    body: JSON.stringify({ state: 'inactive' }),
  });
  if (!res.ok) {
    console.error('[unsubscribe] Kit state update failed', res.status, await res.text());
  } else {
    console.log('[unsubscribe] Unsubscribed', email.replace(/(.).*(@.*)/, '$1***$2'));
  }
}

// RFC 8058 one-click — email clients POST to List-Unsubscribe URL
export async function POST({ request }: { request: Request }): Promise<Response> {
  const e = cfEnv as unknown as Record<string, string>;
  const url = new URL(request.url);
  const email = url.searchParams.get('email') ?? '';
  if (!email) return new Response('Missing email', { status: 400 });
  const kitKey = e['KIT_API_KEY'] ?? '';
  if (kitKey) await kitUnsubscribe(kitKey, email).catch(() => {});
  return new Response('Unsubscribed', { status: 200 });
}

// Browser click from in-body unsubscribe link
export async function GET({ request }: { request: Request }): Promise<Response> {
  const e = cfEnv as unknown as Record<string, string>;
  const url = new URL(request.url);
  const email = url.searchParams.get('email') ?? '';
  const kitKey = e['KIT_API_KEY'] ?? '';
  if (email && kitKey) await kitUnsubscribe(kitKey, email).catch(() => {});
  const html = [
    '<!doctype html><html lang="en"><head>',
    '<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">',
    '<title>Unsubscribed · Thee Rainers</title>',
    '<style>',
    'body{font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;background:#fff;',
    'color:#0A0A0A;display:flex;align-items:center;justify-content:center;',
    'min-height:100vh;margin:0;padding:24px;box-sizing:border-box;}',
    '.c{max-width:400px;text-align:center;}',
    'p{margin:0 0 12px;font-size:14px;color:#555;line-height:1.6;}',
    'a{color:#E11D2A;text-decoration:none;font-size:13px;}',
    '</style></head><body>',
    '<div class="c">',
    '<p style="font-size:11px;letter-spacing:0.12em;text-transform:uppercase;color:#aaa;margin-bottom:16px;">Thee Rainers</p>',
    '<p style="font-size:20px;font-weight:900;text-transform:uppercase;color:#0A0A0A;margin-bottom:12px;">Unsubscribed.</p>',
    '<p>You have been removed from the list. No further emails will be sent.</p>',
    `<a href="${SITE_URL}">Back to theerainers.com</a>`,
    '</div></body></html>',
  ].join('');
  return new Response(html, { status: 200, headers: { 'Content-Type': 'text/html; charset=utf-8' } });
}
