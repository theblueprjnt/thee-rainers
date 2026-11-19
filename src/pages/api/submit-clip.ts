// POST /api/submit-clip
// Footage review clip submission for the $99 Defense Workshop tier
// (Live + footage review). Buyer pastes an unlisted YouTube or Google Drive
// link. Verified against a real Stripe checkout session for the review tier
// before saving, so only buyers can submit -- not open to anyone who finds
// the endpoint.
//
// Env vars required:
//   STRIPE_SECRET_KEY     — to verify the session belongs to a review-tier purchase
//   AIRTABLE_API_KEY      — Airtable PAT
//   AIRTABLE_BASE_ID      — Airtable base ID
//   TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID — sale/submission alert

export const prerender = false;

import type { APIContext } from 'astro';
import Stripe from 'stripe';
import { env as cfEnv } from 'cloudflare:workers';
import { sendTelegramAlert } from '../../lib/telegram';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
// Clip links accepted: unlisted YouTube or Google Drive only, per the brief.
const CLIP_URL_RE = /^https:\/\/(www\.)?(youtube\.com|youtu\.be|drive\.google\.com)\//;
const REVIEW_TIER_PRICE_ID = 'price_1UdSbdHzlarU775HtG58zLEo'; // UNVERIFIED against live Stripe this session, see report

function corsHeaders(origin: string): Record<string, string> {
  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };
}

async function upsertClipRecord(
  token: string,
  baseId: string,
  fields: Record<string, string>,
): Promise<void> {
  if (!token || !baseId) return;
  try {
    const res = await fetch(`https://api.airtable.com/v0/${baseId}/Clip_Submissions`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ records: [{ fields }] }),
    });
    if (!res.ok) {
      console.error('[submit-clip] Airtable insert failed', res.status, await res.text().catch(() => ''));
    }
  } catch (err) {
    console.error('[submit-clip] Airtable insert fetch error:', String(err));
  }
}

export async function OPTIONS(_ctx: APIContext): Promise<Response> {
  const origin = (cfEnv as unknown as Record<string, string>)['SITE_URL'] || 'https://theerainers.com';
  return new Response(null, { status: 204, headers: corsHeaders(origin) });
}

export async function POST({ request }: APIContext): Promise<Response> {
  const e = cfEnv as unknown as Record<string, string>;
  const origin = e['SITE_URL'] || 'https://theerainers.com';
  const headers = corsHeaders(origin);

  let email = '';
  let clipUrl = '';
  let sessionId = '';
  try {
    const body = (await request.json()) as Record<string, string>;
    email = (body.email ?? '').trim().toLowerCase();
    clipUrl = (body.clipUrl ?? '').trim();
    sessionId = (body.sessionId ?? '').trim();
  } catch {
    return new Response(JSON.stringify({ success: false, error: 'Malformed request.' }), { status: 400, headers });
  }

  if (!email || !EMAIL_RE.test(email)) {
    return new Response(JSON.stringify({ success: false, error: 'A valid email address is required.' }), { status: 400, headers });
  }
  if (!clipUrl || !CLIP_URL_RE.test(clipUrl)) {
    return new Response(JSON.stringify({ success: false, error: 'Paste an unlisted YouTube or Google Drive link.' }), { status: 400, headers });
  }
  if (!sessionId) {
    return new Response(JSON.stringify({ success: false, error: 'Missing checkout session.' }), { status: 400, headers });
  }

  // Verify this session is a real, paid review-tier purchase for this email
  // -- this is the "only buyers can submit" gate the brief asked for.
  const stripeKey = e['STRIPE_SECRET_KEY'] ?? '';
  if (!stripeKey) {
    console.error('[submit-clip] STRIPE_SECRET_KEY not set — cannot verify submission');
    return new Response(JSON.stringify({ success: false, error: 'Submission is temporarily unavailable. Email rainers@theerainers.com with your clip link instead.' }), { status: 503, headers });
  }

  try {
    const stripe = new Stripe(stripeKey, { httpClient: Stripe.createFetchHttpClient() });
    const session = await stripe.checkout.sessions.retrieve(sessionId, { expand: ['line_items'] });

    if (session.payment_status !== 'paid') {
      return new Response(JSON.stringify({ success: false, error: 'This checkout session has not been paid.' }), { status: 403, headers });
    }
    const sessionEmail = (session.customer_details?.email ?? session.customer_email ?? '').toLowerCase();
    if (sessionEmail !== email) {
      return new Response(JSON.stringify({ success: false, error: 'Email does not match this checkout session.' }), { status: 403, headers });
    }
    const boughtReviewTier = session.line_items?.data?.some(li => li.price?.id === REVIEW_TIER_PRICE_ID);
    if (!boughtReviewTier) {
      return new Response(JSON.stringify({ success: false, error: 'This session did not purchase the footage review tier.' }), { status: 403, headers });
    }
  } catch (err) {
    console.error('[submit-clip] Stripe verification error:', String(err));
    return new Response(JSON.stringify({ success: false, error: 'Could not verify your purchase. Email rainers@theerainers.com with your clip link instead.' }), { status: 500, headers });
  }

  const airtableToken = e['AIRTABLE_API_KEY'] ?? '';
  const airtableBase = e['AIRTABLE_BASE_ID'] ?? '';

  await upsertClipRecord(airtableToken, airtableBase, {
    Email: email,
    'Clip URL': clipUrl,
    'Stripe Session ID': sessionId,
    'Submitted At': new Date().toISOString(),
  });

  await sendTelegramAlert(
    e['TELEGRAM_BOT_TOKEN'] ?? '',
    e['TELEGRAM_CHAT_ID'] ?? '',
    `CLIP SUBMITTED: ${email.replace(/(.).*(@.*)/, '$1***$2')} — ${clipUrl}`,
  );

  return new Response(JSON.stringify({ success: true }), { status: 200, headers });
}
