export const prerender = false;

import { env as cfEnv } from 'cloudflare:workers';

const KIT_MEMBER_TAG   = '19807647';
const KIT_ATTENDED_TAG = '21027824'; // E7: first session, activated
const KIT_RETURNED_TAG = '21027825'; // E8: second session, return ritual confirmed
const SITE_URL         = 'https://theerainers.com';

function checkinHtml(message: string): string {
  return [
    '<!doctype html><html lang="en"><head>',
    '<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">',
    '<title>Session Check-In · Thee Rainers</title>',
    '<style>',
    'body{font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;background:#0A0A0A;',
    'color:#fff;display:flex;align-items:center;justify-content:center;',
    'min-height:100vh;margin:0;padding:24px;box-sizing:border-box;}',
    '.c{max-width:420px;text-align:center;}',
    'p{margin:0 0 12px;font-size:15px;color:rgba(255,255,255,0.65);line-height:1.6;}',
    'a{color:rgba(255,255,255,0.35);text-decoration:none;font-size:11px;',
    'letter-spacing:0.1em;text-transform:uppercase;}',
    '</style></head><body>',
    '<div class="c">',
    '<p style="font-size:11px;letter-spacing:0.12em;text-transform:uppercase;',
    'color:rgba(255,255,255,0.25);margin-bottom:16px;">The Weekly Session</p>',
    `<p style="font-size:18px;font-weight:900;text-transform:uppercase;color:#fff;margin-bottom:12px;">${message}</p>`,
    `<a href="${SITE_URL}/community/inside">Member area →</a>`,
    '</div></body></html>',
  ].join('');
}

async function kitSubId(apiKey: string, email: string): Promise<number | null> {
  const res = await fetch(
    `https://api.kit.com/v4/subscribers?email_address=${encodeURIComponent(email)}`,
    { headers: { 'X-Kit-Api-Key': apiKey } },
  );
  if (!res.ok) return null;
  const data = await res.json().catch(() => ({})) as Record<string, unknown>;
  const subs = data?.subscribers as Array<Record<string, unknown>> | undefined;
  const id = subs?.[0]?.id;
  return typeof id === 'number' ? id : null;
}

async function kitTagIds(apiKey: string, subId: number): Promise<Set<string>> {
  const res = await fetch(
    `https://api.kit.com/v4/tags?subscriber_id=${subId}&per_page=100`,
    { headers: { 'X-Kit-Api-Key': apiKey } },
  );
  if (!res.ok) return new Set();
  const data = await res.json().catch(() => ({})) as Record<string, unknown>;
  const tags = data?.tags as Array<Record<string, unknown>> | undefined;
  return new Set((tags ?? []).map((t) => String(t.id)));
}

async function addTag(apiKey: string, subId: number, tagId: string): Promise<void> {
  await fetch(`https://api.kit.com/v4/tags/${tagId}/subscribers`, {
    method: 'POST',
    headers: { 'X-Kit-Api-Key': apiKey, 'Content-Type': 'application/json' },
    body: JSON.stringify({ subscriber_id: subId }),
  });
}

export async function GET({ request }: { request: Request }): Promise<Response> {
  const e = cfEnv as unknown as Record<string, string>;
  const kitKey = e['KIT_API_KEY'] ?? '';
  const url = new URL(request.url);
  const email = (url.searchParams.get('email') ?? '').trim().toLowerCase();

  const reply = (msg: string) =>
    new Response(checkinHtml(msg), {
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
    });

  if (!email || !kitKey) {
    return reply('Something went wrong. Email rainers@theerainers.com.');
  }

  try {
    const subId = await kitSubId(kitKey, email);
    if (!subId) return reply('Email not found. Email rainers@theerainers.com if this is wrong.');

    const tagIds = await kitTagIds(kitKey, subId);

    if (!tagIds.has(KIT_MEMBER_TAG)) {
      return reply('Membership not found for this email. Email rainers@theerainers.com.');
    }

    if (!tagIds.has(KIT_ATTENDED_TAG)) {
      await addTag(kitKey, subId, KIT_ATTENDED_TAG);
      console.log('[checkin] E7 first-attendance tagged', email.replace(/(.).*(@.*)/, '$1***$2'));
      return reply('Checked in. First session confirmed.');
    }

    if (!tagIds.has(KIT_RETURNED_TAG)) {
      await addTag(kitKey, subId, KIT_RETURNED_TAG);
      console.log('[checkin] E8 return-ritual tagged', email.replace(/(.).*(@.*)/, '$1***$2'));
      return reply('Checked in. Return ritual confirmed.');
    }

    return reply('Already checked in. See you in the session.');
  } catch (err) {
    console.error('[checkin] error', err);
    return reply('Something went wrong. Email rainers@theerainers.com.');
  }
}
