// POST /api/resend-webhook
// Receives Resend delivery events (delivered, bounced, complained).
// Logs to Airtable Email_Events table for observability.
// Env vars: RESEND_WEBHOOK_SECRET (optional, for future sig verification),
//           AIRTABLE_API_KEY, AIRTABLE_BASE_ID

export const prerender = false;

import type { APIContext } from 'astro';
import { env as cfEnv } from 'cloudflare:workers';

const FIVE_MINUTES_SECONDS = 300;

// Resend signs webhooks via Svix: HMAC-SHA256 over "{svix-id}.{svix-timestamp}.{rawBody}"
// using the base64 payload of RESEND_WEBHOOK_SECRET (format "whsec_<base64>"). Without
// this, the endpoint accepts and logs any POST body unauthenticated -- anyone could
// inject arbitrary rows into Email_Events. https://resend.com/docs/dashboard/webhooks/verify-webhooks-requests
async function verifySvixSignature(secret: string, svixId: string, svixTimestamp: string, rawBody: string, svixSignature: string): Promise<boolean> {
  if (!secret || !svixId || !svixTimestamp || !svixSignature) return false;

  const tsSeconds = Number(svixTimestamp);
  if (!Number.isFinite(tsSeconds) || Math.abs(Date.now() / 1000 - tsSeconds) > FIVE_MINUTES_SECONDS) return false;

  try {
    const secretBytes = Uint8Array.from(atob(secret.replace(/^whsec_/, '')), c => c.charCodeAt(0));
    const key = await crypto.subtle.importKey('raw', secretBytes, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
    const sigBuf = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(`${svixId}.${svixTimestamp}.${rawBody}`));
    const expected = btoa(String.fromCharCode(...new Uint8Array(sigBuf)));
    const provided = svixSignature.split(' ').map(p => p.split(',')[1]).filter(Boolean);
    return provided.includes(expected);
  } catch (err) {
    console.error('[resend-webhook] signature check error:', String(err));
    return false;
  }
}

export async function POST({ request, locals }: APIContext): Promise<Response> {
  const cfCtx = (locals as { cfContext?: { waitUntil(p: Promise<unknown>): void } }).cfContext;
  const waitUntil = cfCtx
    ? (p: Promise<unknown>) => cfCtx.waitUntil(p)
    : (p: Promise<unknown>) => { p.catch(() => {}); };

  const e = cfEnv as unknown as Record<string, string>;
  const webhookSecret = e['RESEND_WEBHOOK_SECRET'] ?? '';

  const rawBody = await request.text();

  if (webhookSecret) {
    const valid = await verifySvixSignature(
      webhookSecret,
      request.headers.get('svix-id') ?? '',
      request.headers.get('svix-timestamp') ?? '',
      rawBody,
      request.headers.get('svix-signature') ?? '',
    );
    if (!valid) {
      console.warn('[resend-webhook] signature verification failed — rejecting');
      return new Response('Unauthorized', { status: 401 });
    }
  } else {
    console.warn('[resend-webhook] RESEND_WEBHOOK_SECRET not set — accepting unverified (set it in Resend dashboard + Cloudflare env)');
  }

  let body: Record<string, unknown>;
  try {
    body = JSON.parse(rawBody) as Record<string, unknown>;
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
