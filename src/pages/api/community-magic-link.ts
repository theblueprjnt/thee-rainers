export const prerender = false;

import { env as cfEnv } from 'cloudflare:workers';

const SITE_URL             = 'https://theerainers.com';
const THIRTY_DAYS_SECONDS  = 30 * 24 * 60 * 60;
const KIT_MEMBER_TAG       = '19807647';

async function isMember(email: string, kitKey: string): Promise<boolean> {
  try {
    const subRes = await fetch(
      `https://api.kit.com/v4/subscribers?email_address=${encodeURIComponent(email)}`,
      { headers: { 'X-Kit-Api-Key': kitKey, Accept: 'application/json' } },
    );
    if (!subRes.ok) return false;
    const subData = await subRes.json() as { subscribers?: Array<{ id: number }> };
    const subId = subData.subscribers?.[0]?.id;
    if (!subId) return false;

    const tagRes = await fetch(
      `https://api.kit.com/v4/tags?subscriber_id=${subId}&per_page=100`,
      { headers: { 'X-Kit-Api-Key': kitKey, Accept: 'application/json' } },
    );
    if (!tagRes.ok) return false;
    const tagData = await tagRes.json() as { tags?: Array<{ id: number }> };
    return (tagData.tags ?? []).some(t => String(t.id) === KIT_MEMBER_TAG);
  } catch {
    return false;
  }
}

async function generateMagicLink(secret: string): Promise<string> {
  const exp    = Math.floor(Date.now() / 1000) + THIRTY_DAYS_SECONDS;
  const key    = await crypto.subtle.importKey(
    'raw', new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'],
  );
  const sigBuf = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(`community-access:${exp}`));
  const sig    = Array.from(new Uint8Array(sigBuf)).map(b => b.toString(16).padStart(2, '0')).join('');
  return `${SITE_URL}/community?sig=${sig}&exp=${exp}#recordings`;
}

function buildEmail(magicLink: string): string {
  return (
    `<div style="font-family:monospace;max-width:540px;margin:0 auto;padding:32px 24px;color:#0A0A0A;">` +
    `<p style="font-size:11px;letter-spacing:0.12em;text-transform:uppercase;color:#888;margin:0 0 24px;">Thee Rainers</p>` +
    `<p style="font-size:15px;line-height:1.6;margin:0 0 8px;">Your access link.</p>` +
    `<p style="font-size:13px;color:#888;line-height:1.6;margin:0 0 24px;">Click below to view past Checkpoint recordings. The link is valid for 30 days.</p>` +
    `<p style="margin:0 0 24px;"><a href="${magicLink}" style="display:inline-block;background:#7C3AED;color:#fff;font-family:monospace;font-size:13px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;text-decoration:none;padding:14px 28px;">VIEW RECORDINGS</a></p>` +
    `<p style="font-size:12px;color:#888;line-height:1.6;margin:0;">If you did not request this, ignore it.</p>` +
    `</div>`
  );
}

export async function POST({ request }: { request: Request }): Promise<Response> {
  const headers = { 'Content-Type': 'application/json' };

  let email = '';
  try {
    const body = await request.json() as { email?: string };
    email = (body.email ?? '').trim().toLowerCase();
  } catch {
    return new Response(JSON.stringify({ ok: false, error: 'bad_request' }), { status: 400, headers });
  }
  if (!email || !email.includes('@')) {
    return new Response(JSON.stringify({ ok: false, error: 'invalid_email' }), { status: 400, headers });
  }

  const e          = cfEnv as unknown as Record<string, string>;
  const kitKey     = e['KIT_API_KEY'] ?? '';
  const secret     = e['WATCH_TOKEN_SECRET'] ?? '';
  const resendKey  = e['RESEND_API_KEY'] ?? '';

  if (!kitKey || !secret || !resendKey) {
    console.error('[community-magic-link] Missing required env vars');
    return new Response(JSON.stringify({ ok: false }), { status: 200, headers });
  }

  const member = await isMember(email, kitKey);
  if (!member) {
    return new Response(JSON.stringify({ ok: false, reason: 'not_member' }), { status: 200, headers });
  }

  const magicLink = await generateMagicLink(secret);

  await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${resendKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from: 'Rainers <rainers@theerainers.com>',
      to: email,
      subject: 'Your Greatness Community access link',
      html: buildEmail(magicLink),
    }),
  }).catch(err => console.error('[community-magic-link] Resend error:', String(err)));

  return new Response(JSON.stringify({ ok: true }), { status: 200, headers });
}
