// POST /api/resend-webhook
// Receives Resend delivery events (delivered, bounced, complained).
// Logs to Airtable Email_Events table for observability.
// Env vars: RESEND_WEBHOOK_SECRET (optional, for future sig verification),
//           AIRTABLE_API_KEY, AIRTABLE_BASE_ID

export const prerender = false;

import type { APIContext } from 'astro';
import { env as cfEnv } from 'cloudflare:workers';

export async function POST({ request, locals }: APIContext): Promise<Response> {
  const cfCtx = (locals as { cfContext?: { waitUntil(p: Promise<unknown>): void } }).cfContext;
  const waitUntil = cfCtx
    ? (p: Promise<unknown>) => cfCtx.waitUntil(p)
    : (p: Promise<unknown>) => { p.catch(() => {}); };

  const e = cfEnv as unknown as Record<string, string>;

  let body: Record<string, unknown>;
  try {
    body = await request.json() as Record<string, unknown>;
  } catch {
    return new Response('Bad Request', { status: 400 });
  }

  const eventType  = String(body.type ?? '');
  const data       = (body.data ?? {}) as Record<string, unknown>;
  const email      = String(data.to ?? data.email_id ?? '');
  const messageId  = String(data.email_id ?? body.id ?? '');
  const timestamp  = String(body.created_at ?? new Date().toISOString());

  console.log('[resend-webhook]', eventType, { email: email.replace(/(.).*(@.*)/, '$1***$2'), messageId });

  const airtableKey  = e['AIRTABLE_API_KEY']  ?? '';
  const airtableBase = e['AIRTABLE_BASE_ID']   ?? '';

  if (airtableKey && airtableBase) {
    waitUntil(
      fetch(`https://api.airtable.com/v0/${airtableBase}/Email_Events`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${airtableKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          records: [{
            fields: {
              Event:      eventType,
              Email:      email,
              Message_ID: messageId,
              Timestamp:  timestamp,
            },
          }],
        }),
      })
        .then(async r => {
          if (!r.ok) console.warn('[resend-webhook] Airtable log failed', r.status, await r.text().catch(() => ''));
        })
        .catch(err => console.error('[resend-webhook] Airtable error:', String(err)))
    );
  } else {
    console.warn('[resend-webhook] AIRTABLE_API_KEY or AIRTABLE_BASE_ID missing — event not logged');
  }

  return new Response('ok', { status: 200 });
}
