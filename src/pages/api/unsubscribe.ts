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
  return new Response(null, { status: 302, headers: { Location: `${SITE_URL}/unsubscribed` } });
}
