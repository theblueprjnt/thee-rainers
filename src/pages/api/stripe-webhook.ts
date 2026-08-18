export const prerender = false;

import type { APIContext } from 'astro';
import Stripe from 'stripe';
import { env as cfEnv } from 'cloudflare:workers';
import { sendTelegramAlert } from '../../lib/telegram';
import { kitSubscriberId, addToKitSequence } from '../../lib/kit';
import { PRODUCTS } from '../../data/products.ts';

// ── D1 idempotency store ─────────────────────────────────────────────────────
// Minimal shape for the WEBHOOK_EVENTS binding — avoids pulling in
// @cloudflare/workers-types as a direct dependency for one binding.
interface D1PreparedStatement {
  bind(...values: unknown[]): D1PreparedStatement;
  run(): Promise<unknown>;
}
interface D1Database {
  prepare(query: string): D1PreparedStatement;
}

// ── product map ────────────────────────────────────────────────────────────
// Canonical IDs come from create-checkout.ts — these are the product IDs that
// Stripe checkout sessions actually reference. The old prod_UZre... IDs were
// payment-link era products and no longer match any active checkout flow.
const PRODUCT_MAP: Record<string, string> = {
  'prod_UZ9lTK2PhsS4xs': 'footwork',
  'prod_UZ9vV79TAun9yB': 'shadowboxing',
  'prod_UZ9xqJt3glrCOO': 'bundle',
  'prod_UZ9z2iC6xZMJVo': 'workshop-replay',
  'prod_Uaz6EzELZP6j0V': 'greatness',
};

// Fallback: checkout session metadata.lookup_key -> slug
// Used when the product ID is unknown or a placeholder. Source of truth is
// the lookup_key set in create-checkout.ts at session creation time.
const LOOKUP_KEY_MAP: Record<string, string> = {
  'greatness_monthly':        'greatness',
  'greatness_annual':         'greatness',
  'workshop_replay':          'workshop-replay',
  'footwork':                 'footwork',
  'shadowboxing':             'shadowboxing',
  'bundle':                   'bundle',
  'defense_workshop_early':   'defense-workshop',
  'defense_workshop_standard':'defense-workshop',
  'grade1':                   'grade1',
  'grade2':                   'grade2',
  'grade3':                   'grade3',
};

// ── asset map ──────────────────────────────────────────────────────────────
const ASSET_MAP: Record<string, string[]> = {
  'footwork':          [
    'thefootworkblueprint/The-Footwork-Blueprint-Thee-Rainers.pdf',
    'thefootworkblueprint/links_theFOOTWORKBlueprint.pdf',
  ],
  'shadowboxing':      ['the shadowboxing blueprint/the shadowboxing blueprint.pdf'],
  'bundle':            [
    'thefootworkblueprint/The-Footwork-Blueprint-Thee-Rainers.pdf',
    'bundle/thefootworkblueprint/links_theFOOTWORKBlueprint.pdf',
    'bundle/the shadowboxing blueprint/the shadowboxing blueprint.pdf',
  ],
  // defense-workshop delivers the replay via watch URL (not R2 PDF)
};

// ── Kit tag IDs ────────────────────────────────────────────────────────────
// TODO: Create tags in Kit (Grow > Tags) and paste the numeric IDs below.
// Tag URL looks like: app.kit.com/tags/1234567 — the number is the ID.
const KIT_PRODUCT_TAGS: Record<string, string> = {
  'footwork':          '19807643', // FIXME: tag 19807643 does not exist in Kit — create it
  'shadowboxing':      '19807641',
  'bundle':            '19807644',
  'defense-workshop':  '19807641', // uses same tag as shadowboxing until a dedicated tag is created
  'greatness':         '19830354',
};

// Grade buyer tag — one shared tag for all three grades (KIT_COACHING_TAG_ID,
// set as a Cloudflare secret, confirmed live 2026-08-17). Per-grade tags
// (grade-1/2/3-buyer) were requested but never created — Kit v4 tag creation
// via API failed 2026-08-16 (account plan-gated for MCP write access). Read
// from env at call time rather than hardcoded, same pattern as every other
// secret in this file.
const KIT_MEMBER_TAG = '19807647';
// 14-day Community trial tag — applied to Blueprint buyers so Kit can fire the
// Day 0 / Day 7 / Day 12 / Day 14 trial-conversion sequence.
// TODO: Rainers — create the tag in Kit (Grow > Tags → "community_trial_14d"),
// copy the numeric ID from the URL (app.kit.com/tags/XXXXX), paste below.
const KIT_TRIAL_TAG_ID = '20130499';
const BLUEPRINT_TRIAL_SLUGS = new Set(['footwork', 'shadowboxing', 'bundle']);

// Post-purchase Kit sequences (created 2026-07-02 via Kit MCP).
const KIT_REPLAY_SEQ_ID     = '2813703'; // Workshop Replay Buyer — 3 emails, D+2/7/14
const KIT_COMMUNITY_SEQ_ID  = '2813705'; // Greatness Community Welcome — 3 emails, D+1/3/7
const KIT_BUNDLE_SEQ_ID     = '2813702'; // Bundle Buyer Nurture — 5 emails, D+0/2/5/9/14
const KIT_WINBACK_SEQ_ID    = '2822141'; // Greatness Win-back — 2 emails, D+3/10

const SEVEN_DAYS_SECONDS  = 7 * 24 * 60 * 60;
const THIRTY_DAYS_SECONDS = 30 * 24 * 60 * 60;
const SITE_URL = 'https://theerainers.com';

// ── GA4 product catalog ────────────────────────────────────────────────────
// Slug → GA4 ecommerce item shape. Keep in sync with PRODUCT_MAP and the
// client-side TR_PRODUCTS map in Base.astro. Source of truth for server-side
// purchase events fired via the GA4 Measurement Protocol.
//
// Prices below come from src/data/products.ts (single source of truth) --
// this used to hardcode defense-workshop at 39 while the live price was
// already 49 (early-bird window closed 2026-08-08), so every GA4 purchase
// event for it understated revenue by $10 unless actualValue overrode it.
// GA4 item `name`/`category` stay as local literals here on purpose: they're
// analytics categorization, not the same thing as the site's product
// display name, and changing them isn't what was asked -- only the price
// mismatch was flagged. Grade 1/2/3 stay hardcoded too, untouched --
// navigation and the Grade pages are a separate decision.
const GA4_CATALOG: Record<string, { name: string; price: number; category: string }> = {
  'footwork':          { name: 'Footwork Blueprint',         price: PRODUCTS.footwork.priceCents / 100,             category: 'one_time' },
  'shadowboxing':      { name: 'Shadowboxing Blueprint',     price: PRODUCTS.shadowboxing.priceCents / 100,         category: 'one_time' },
  'bundle':            { name: 'Complete Bundle',            price: PRODUCTS.bundle.priceCents / 100,               category: 'one_time' },
  'workshop-replay':   { name: 'Workshop Replay',            price: PRODUCTS['workshop-replay'].priceCents / 100,   category: 'on_demand' },
  'defense-workshop':  { name: 'Defense Workshop',           price: PRODUCTS['defense-workshop'].priceCents / 100,  category: 'one_time' },
  'greatness':         { name: 'Greatness Community',        price: PRODUCTS.greatness.priceCents / 100,            category: 'subscription' },
  'grade1':            { name: 'Grade 1 Foundation',         price: 347, category: 'one_time' },
  'grade2':            { name: 'Grade 2 Development',        price: 997, category: 'one_time' },
  'grade3':            { name: 'Grade 3',                    price: 12000, category: 'one_time' },
};

// ── GA4 Measurement Protocol — server-side purchase event ──────────────────
// Fires from Stripe webhook so every confirmed payment becomes a GA4 purchase
// event regardless of browser ad blockers, Safari ITP, or pixel failures. This
// is the trust signal — Stripe says "they paid", GA4 records it as conversion.
// Gracefully skips if env vars are absent (logged so dev can fix).
async function sendGA4Purchase(
  e: Record<string, string>,
  args: {
    slug: string;
    transactionId: string;
    customerEmail?: string;
    customerStripeId?: string;
    actualValue?: number;
  },
): Promise<void> {
  const measurementId = e['GA4_MEASUREMENT_ID'] ?? '';
  const apiSecret     = e['GA4_API_SECRET'] ?? '';

  if (!measurementId || !apiSecret) {
    console.warn('[ga4] purchase skipped — GA4_MEASUREMENT_ID and/or GA4_API_SECRET not set', {
      slug: args.slug,
      transactionId: args.transactionId,
    });
    return;
  }

  const product = GA4_CATALOG[args.slug];
  if (!product) {
    console.warn('[ga4] purchase skipped — unknown product slug', { slug: args.slug });
    return;
  }
  const value = args.actualValue ?? product.price;

  // GA4 needs a stable client_id per buyer for deduping with browser events.
  // Use Stripe customer id when present, fallback to email hash, fallback to txn.
  const clientId =
    args.customerStripeId
      ? `stripe.${args.customerStripeId}`
      : args.customerEmail
        ? `email.${args.customerEmail.toLowerCase()}`
        : `txn.${args.transactionId}`;

  const payload = {
    client_id: clientId,
    events: [{
      name: 'purchase',
      params: {
        transaction_id: args.transactionId,
        currency: 'USD',
        value,
        items: [{
          item_id: args.slug,
          item_name: product.name,
          item_category: product.category,
          price: value,
          quantity: 1,
        }],
      },
    }],
  };

  const url = `https://www.google-analytics.com/mp/collect?measurement_id=${encodeURIComponent(measurementId)}&api_secret=${encodeURIComponent(apiSecret)}`;

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      console.error('[ga4] purchase rejected', { status: res.status, slug: args.slug, txn: args.transactionId });
    } else {
      console.log('[ga4] purchase recorded', { slug: args.slug, value, txn: args.transactionId });
    }
  } catch (err) {
    console.error('[ga4] purchase fetch failed', String(err));
  }
}

// ── Kit v4 helpers ─────────────────────────────────────────────────────────
// kitSubscriberId + addToKitSequence live in ../../lib/kit.ts (shared with
// lead-capture.ts). tagKit/untagKit stay here — only this file uses them.

async function tagKit(apiKey: string, email: string, tagId: string): Promise<void> {
  if (!apiKey || tagId.startsWith('KIT_TAG_')) return; // placeholder — skip silently
  const id = await kitSubscriberId(apiKey, email);
  if (!id) return;
  await fetch(`https://api.kit.com/v4/tags/${tagId}/subscribers/${id}`, {
    method: 'POST',
    headers: { 'X-Kit-Api-Key': apiKey, 'Content-Type': 'application/json' },
    body: '{}',
  });
}

async function untagKit(apiKey: string, email: string, tagId: string): Promise<void> {
  if (!apiKey || tagId.startsWith('KIT_TAG_')) return;
  const id = await kitSubscriberId(apiKey, email);
  if (!id) return;
  await fetch(`https://api.kit.com/v4/tags/${tagId}/subscribers/${id}`, {
    method: 'DELETE',
    headers: { 'X-Kit-Api-Key': apiKey },
  });
}

// ── Airtable helpers ───────────────────────────────────────────────────────

async function upsertAirtable(
  token: string,
  baseId: string,
  table: string,
  fields: Record<string, string>,
): Promise<void> {
  if (!token || !baseId || !fields.Email) return;
  await fetch(`https://api.airtable.com/v0/${baseId}/${encodeURIComponent(table)}`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      performUpsert: { fieldsToMergeOn: ['Email'] },
      records: [{ fields }],
    }),
  });
}

// ── token ──────────────────────────────────────────────────────────────────

function generateToken(): string {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
}

// ── AWS SigV4 helpers ──────────────────────────────────────────────────────

async function sha256hex(message: string): Promise<string> {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(message));
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
}

async function hmacBuf(key: ArrayBuffer | Uint8Array, msg: string): Promise<ArrayBuffer> {
  const k = await crypto.subtle.importKey(
    'raw', key, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'],
  );
  return crypto.subtle.sign('HMAC', k, new TextEncoder().encode(msg));
}

async function hmacHex(key: ArrayBuffer, msg: string): Promise<string> {
  const buf = await hmacBuf(key, msg);
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
}

async function r2SigningKey(secret: string, dateOnly: string): Promise<ArrayBuffer> {
  const k1 = await hmacBuf(new TextEncoder().encode('AWS4' + secret), dateOnly);
  const k2 = await hmacBuf(k1, 'auto');
  const k3 = await hmacBuf(k2, 's3');
  return hmacBuf(k3, 'aws4_request');
}

function buildCanonicalQS(params: [string, string][]): string {
  return [...params]
    .sort((a, b) => (a[0] < b[0] ? -1 : a[0] > b[0] ? 1 : 0))
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
    .join('&');
}

async function generateR2PresignedUrl(
  accountId: string, accessKey: string, secretKey: string, bucket: string, objectKey: string,
): Promise<string> {
  const now      = new Date();
  const dateStr  = now.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}Z$/, 'Z');
  const dateOnly = dateStr.slice(0, 8);
  const host       = `${bucket}.${accountId}.r2.cloudflarestorage.com`;
  const credential = `${accessKey}/${dateOnly}/auto/s3/aws4_request`;
  const queryParams: [string, string][] = [
    ['X-Amz-Algorithm',     'AWS4-HMAC-SHA256'],
    ['X-Amz-Credential',    credential],
    ['X-Amz-Date',          dateStr],
    ['X-Amz-Expires',       String(SEVEN_DAYS_SECONDS)],
    ['X-Amz-SignedHeaders', 'host'],
  ];
  const encodedKey       = objectKey.split('/').map(encodeURIComponent).join('/');
  const canonicalQS      = buildCanonicalQS(queryParams);
  const canonicalRequest = `GET\n/${encodedKey}\n${canonicalQS}\nhost:${host}\n\nhost\nUNSIGNED-PAYLOAD`;
  const scope            = `${dateOnly}/auto/s3/aws4_request`;
  const stringToSign     = `AWS4-HMAC-SHA256\n${dateStr}\n${scope}\n${await sha256hex(canonicalRequest)}`;
  const sigKey           = await r2SigningKey(secretKey, dateOnly);
  const signature        = await hmacHex(sigKey, stringToSign);
  return `https://${host}/${encodedKey}?${canonicalQS}&X-Amz-Signature=${signature}`;
}

// No expiry -- it's just an unlisted YouTube video, there's nothing to
// meaningfully cut off access to. The signature still stops the URL from
// being guessable/enumerable, it just never times out.
async function generateWatchUrl(secret: string, product: string): Promise<string> {
  const sigBuf = await hmacBuf(new TextEncoder().encode(secret), product);
  const sig    = Array.from(new Uint8Array(sigBuf)).map(b => b.toString(16).padStart(2, '0')).join('');
  return `${SITE_URL}/watch/${product}?sig=${sig}`;
}

async function generateCommunityMagicLink(secret: string): Promise<string> {
  const exp    = Math.floor(Date.now() / 1000) + THIRTY_DAYS_SECONDS;
  const sigBuf = await hmacBuf(new TextEncoder().encode(secret), `community-access:${exp}`);
  const sig    = Array.from(new Uint8Array(sigBuf)).map(b => b.toString(16).padStart(2, '0')).join('');
  return `${SITE_URL}/community?sig=${sig}&exp=${exp}#recordings`;
}

// ── delivery email via Resend ──────────────────────────────────────────────

const DELIVERY_SUBJECTS: Record<string, string> = {
  'footwork':          'Your Footwork Blueprint',
  'shadowboxing':      'Your Shadowboxing Blueprint',
  'bundle':            'Your Blueprints',
  'workshop-replay':   'Your Defense Workshop Replay',
  'defense-workshop':  'Your Defense Workshop Replay',
  'greatness':         'You are in.',
};

function buildDeliveryHtml(slug: string, urls: string[], email: string, env?: Record<string, string>): string {
  const [url, url2, url3] = urls;
  const unsubUrl = `${SITE_URL}/api/unsubscribe?email=${encodeURIComponent(email)}`;
  const wrap = (inner: string) =>
    `<div style="font-family:monospace;max-width:540px;margin:0 auto;padding:32px 24px;color:#0A0A0A;">` +
    `<p style="font-size:11px;letter-spacing:0.12em;text-transform:uppercase;color:#888;margin:0 0 24px;">Thee Rainers</p>` +
    inner +
    `<p style="font-size:12px;color:#888;line-height:1.6;margin:0 0 16px;">Questions: <a href="mailto:rainers@theerainers.com" style="color:#E11D2A;">rainers@theerainers.com</a></p>` +
    `<p style="font-size:11px;text-align:center;margin:0;"><a href="${unsubUrl}" style="color:#ccc;text-decoration:underline;">Unsubscribe</a></p>` +
    `</div>`;

  const btn = (href: string, label: string) =>
    `<p style="margin:0 0 24px;"><a href="${href}" style="display:inline-block;background:#E11D2A;color:#fff;font-family:monospace;font-size:13px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;text-decoration:none;padding:14px 28px;">${label}</a></p>`;

  if (slug === 'bundle' && url2 && url3) {
    return wrap(
      `<p style="font-size:15px;line-height:1.6;margin:0 0 24px;">Both blueprints are ready.</p>` +
      `<p style="font-size:12px;letter-spacing:0.1em;text-transform:uppercase;color:#888;margin:0 0 10px;">Footwork Blueprint</p>` +
      btn(url, 'Download Footwork Blueprint') +
      btn(url2, 'Download Footwork Resource Links') +
      `<p style="font-size:12px;letter-spacing:0.1em;text-transform:uppercase;color:#888;margin:0 0 10px;">Shadowboxing Blueprint</p>` +
      btn(url3, 'Download Shadowboxing Blueprint') +
      `<p style="font-size:12px;color:#888;line-height:1.6;margin:0 0 8px;">All links expire in 7 days. Save all files before then.</p>`,
    );
  }
  if (slug === 'workshop-replay') {
    return wrap(
      `<p style="font-size:15px;line-height:1.6;margin:0 0 16px;">Your Defense Workshop replay is ready.</p>` +
      btn(url, 'Watch the Replay') +
      `<p style="font-size:12px;color:#888;line-height:1.6;margin:0 0 16px;">90 minutes. Footwork, stance, punch mechanics, defensive structure, live Q&amp;A. This link doesn't expire.</p>`,
    );
  }
  if (slug === 'greatness') {
    return wrap(
      `<p style="font-size:15px;line-height:1.6;margin:0 0 8px;">You are in.</p>` +
      `<p style="font-size:13px;color:#888;line-height:1.6;margin:0 0 24px;">Your Weekly Session membership is active.</p>` +
      btn(url, 'Access Member Area') +
      `<p style="font-size:12px;letter-spacing:0.1em;text-transform:uppercase;color:#888;margin:0 0 10px;">What happens next</p>` +
      `<table style="width:100%;border-collapse:collapse;margin:0 0 16px;">` +
      `<tr><td style="padding:10px 0;border-bottom:1px solid #f0f0f0;font-size:13px;color:#0A0A0A;width:60%;">Tuesday Checkpoint</td><td style="padding:10px 0;border-bottom:1px solid #f0f0f0;font-size:12px;color:#888;text-align:right;">Live on Google Meet, 3pm ET every Tuesday</td></tr>` +
      `<tr><td style="padding:10px 0;border-bottom:1px solid #f0f0f0;font-size:13px;color:#0A0A0A;">Weekly drill</td><td style="padding:10px 0;border-bottom:1px solid #f0f0f0;font-size:12px;color:#888;text-align:right;">Sent by email each week</td></tr>` +
      `<tr><td style="padding:10px 0;border-bottom:1px solid #f0f0f0;font-size:13px;color:#0A0A0A;">Session recordings</td><td style="padding:10px 0;border-bottom:1px solid #f0f0f0;font-size:12px;color:#888;text-align:right;">In the member area after each session</td></tr>` +
      `<tr><td style="padding:10px 0;font-size:13px;color:#0A0A0A;">Manage / cancel</td><td style="padding:10px 0;font-size:12px;color:#888;text-align:right;">Via Customer Portal, link in member area</td></tr>` +
      `</table>`,
    );
  }
  if (slug === 'footwork' && url2) {
    return wrap(
      `<p style="font-size:15px;line-height:1.6;margin:0 0 24px;">Your Footwork Blueprint is ready.</p>` +
      btn(url, 'Download Footwork Blueprint') +
      `<p style="font-size:12px;letter-spacing:0.1em;text-transform:uppercase;color:#888;margin:0 0 10px;">Also included</p>` +
      btn(url2, 'Download Resource Links') +
      `<p style="font-size:12px;color:#888;line-height:1.6;margin:0 0 8px;">Both links expire in 7 days. Save both files before then.</p>`,
    );
  }
  // footwork (single-link fallback) or shadowboxing
  const label = slug === 'footwork' ? 'Download Footwork Blueprint' : 'Download Shadowboxing Blueprint';
  return wrap(
    `<p style="font-size:15px;line-height:1.6;margin:0 0 16px;">${DELIVERY_SUBJECTS[slug] ?? 'Your purchase'} is ready.</p>` +
    btn(url, label) +
    `<p style="font-size:12px;color:#888;line-height:1.6;margin:0 0 8px;">This link expires in 7 days. Save the file before then.</p>`,
  );
}

// ── Grade purchase confirmation (Phase 3, Step 4) ───────────────────────────
// Grade buyers previously got a thank-you page and silence -- no email, no
// tag. This is the fix: fires on checkout.session.completed for grade1/2/3,
// alongside the existing deliverProduct() call (which correctly no-ops for
// these slugs since there's no ASSET_MAP entry -- Grades aren't a file).
const GRADE_CALENDLY_URL = 'https://calendly.com/theerainers/1-1';

function buildGradeConfirmationHtml(gradeName: string, priceLabel: string, email: string): string {
  const unsubUrl = `${SITE_URL}/api/unsubscribe?email=${encodeURIComponent(email)}`;
  return (
    `<div style="font-family:monospace;max-width:540px;margin:0 auto;padding:32px 24px;color:#0A0A0A;">` +
    `<p style="font-size:11px;letter-spacing:0.12em;text-transform:uppercase;color:#888;margin:0 0 24px;">Thee Rainers</p>` +
    `<p style="font-size:15px;line-height:1.6;margin:0 0 8px;">You're in. Book your first call below.</p>` +
    `<p style="font-size:13px;color:#888;line-height:1.6;margin:0 0 24px;">${gradeName} &middot; ${priceLabel}</p>` +
    `<p style="margin:0 0 24px;"><a href="${GRADE_CALENDLY_URL}" style="display:inline-block;background:#E11D2A;color:#fff;font-family:monospace;font-size:13px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;text-decoration:none;padding:14px 28px;">Book Your Call</a></p>` +
    `<p style="font-size:12px;letter-spacing:0.1em;text-transform:uppercase;color:#888;margin:0 0 10px;">Before your first call</p>` +
    `<p style="font-size:13px;color:#0A0A0A;line-height:1.6;margin:0 0 20px;">Film a short clip of yourself shadowboxing or hitting pads, whatever you have access to. Good lighting, full body in frame.</p>` +
    `<p style="font-size:12px;letter-spacing:0.1em;text-transform:uppercase;color:#888;margin:0 0 10px;">Where to send it</p>` +
    `<p style="font-size:13px;color:#0A0A0A;line-height:1.6;margin:0 0 24px;">Email it to rainers@theerainers.com before your call, or bring it on the call itself.</p>` +
    `<p style="font-size:12px;color:#888;line-height:1.6;margin:0 0 16px;">Questions: <a href="mailto:rainers@theerainers.com" style="color:#E11D2A;">rainers@theerainers.com</a></p>` +
    `<p style="font-size:11px;text-align:center;margin:0;"><a href="${unsubUrl}" style="color:#ccc;text-decoration:underline;">Unsubscribe</a></p>` +
    `</div>`
  );
}

async function sendGradeConfirmation(
  resendKey: string,
  email: string,
  gradeName: string,
  priceLabel: string,
): Promise<void> {
  if (!resendKey) return;
  const subject = "You're in. Book your first call.";
  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${resendKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: 'Thee Rainers <rainers@theerainers.com>',
        to: [email],
        subject,
        html: buildGradeConfirmationHtml(gradeName, priceLabel, email),
      }),
    });
    if (!res.ok) {
      console.error('[stripe-webhook] Grade confirmation email failed', res.status, await res.text());
    } else {
      console.log('[stripe-webhook] Grade confirmation email sent for', gradeName);
    }
  } catch (err) {
    console.error('[stripe-webhook] Grade confirmation email fetch error:', String(err));
  }
}

function buildPaymentFailedHtml(portalUrl: string, email: string): string {
  const unsubUrl = `${SITE_URL}/api/unsubscribe?email=${encodeURIComponent(email)}`;
  return (
    `<div style="font-family:monospace;max-width:540px;margin:0 auto;padding:32px 24px;color:#0A0A0A;">` +
    `<p style="font-size:11px;letter-spacing:0.12em;text-transform:uppercase;color:#888;margin:0 0 24px;">Thee Rainers</p>` +
    `<p style="font-size:15px;line-height:1.6;margin:0 0 16px;">Your payment was declined.</p>` +
    `<p style="font-size:13px;color:#888;line-height:1.6;margin:0 0 24px;">Your Weekly Session access is preserved for the next 7 days while the charge retries.</p>` +
    `<p style="margin:0 0 24px;"><a href="${portalUrl}" style="display:inline-block;background:#E11D2A;color:#fff;font-family:monospace;font-size:13px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;text-decoration:none;padding:14px 28px;">UPDATE YOUR CARD</a></p>` +
    `<p style="font-size:12px;color:#888;line-height:1.6;margin:0 0 16px;">If you meant to cancel, ignore this. No charge will be made after retries are exhausted.</p>` +
    `<p style="font-size:12px;color:#888;line-height:1.6;margin:0 0 16px;">Questions: <a href="mailto:rainers@theerainers.com" style="color:#E11D2A;">rainers@theerainers.com</a></p>` +
    `<p style="font-size:11px;text-align:center;margin:0;"><a href="${unsubUrl}" style="color:#ccc;text-decoration:underline;">Unsubscribe</a></p>` +
    `</div>`
  );
}

function buildCanceledHtml(email: string): string {
  const unsubUrl = `${SITE_URL}/api/unsubscribe?email=${encodeURIComponent(email)}`;
  return (
    `<div style="font-family:monospace;max-width:540px;margin:0 auto;padding:32px 24px;color:#0A0A0A;">` +
    `<p style="font-size:11px;letter-spacing:0.12em;text-transform:uppercase;color:#888;margin:0 0 24px;">Thee Rainers</p>` +
    `<p style="font-size:15px;line-height:1.6;margin:0 0 16px;">Before you go.</p>` +
    `<p style="font-size:13px;color:#0A0A0A;line-height:1.6;margin:0 0 8px;">One question: what made you leave The Weekly Session?</p>` +
    `<p style="font-size:13px;color:#888;line-height:1.6;margin:0 0 24px;">Reply to this email. One sentence. I read every reply.</p>` +
    `<p style="font-size:13px;color:#888;line-height:1.6;margin:0 0 16px;">If you want back in: <a href="${SITE_URL}/community" style="color:#E11D2A;">${SITE_URL}/community</a></p>` +
    `<p style="font-size:12px;color:#888;line-height:1.6;margin:0 0 16px;">Rainers</p>` +
    `<p style="font-size:11px;text-align:center;margin:0;"><a href="${unsubUrl}" style="color:#ccc;text-decoration:underline;">Unsubscribe</a></p>` +
    `</div>`
  );
}

async function sendResendDelivery(
  resendKey: string,
  email: string,
  slug: string,
  urls: string[],
  env?: Record<string, string>,
): Promise<void> {
  if (!resendKey || urls.length === 0) return;
  const subject = DELIVERY_SUBJECTS[slug] ?? 'Your purchase from Thee Rainers';
  try {
    const unsubUrl = `${SITE_URL}/api/unsubscribe?email=${encodeURIComponent(email)}`;
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${resendKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: 'Thee Rainers <rainers@theerainers.com>',
        to: [email],
        subject,
        html: buildDeliveryHtml(slug, urls, email, env),
        headers: {
          'List-Unsubscribe': `<mailto:rainers@theerainers.com?subject=unsubscribe>, <${unsubUrl}>`,
          'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
        },
      }),
    });
    if (!res.ok) {
      console.error('[stripe-webhook] Resend delivery failed', res.status, await res.text());
    } else {
      console.log('[stripe-webhook] Resend delivery sent for', slug);
    }
  } catch (err) {
    console.error('[stripe-webhook] Resend fetch error:', String(err));
  }
}

// ── delivery ───────────────────────────────────────────────────────────────

async function deliverProduct(email: string, productId: string, e: Record<string, string>, slugHint?: string): Promise<void> {
  const token       = generateToken();
  const productSlug = slugHint ?? PRODUCT_MAP[productId] ?? 'unknown';
  const expiringUrls: string[] = [];

  if (productSlug === 'workshop-replay' || productSlug === 'defense-workshop') {
    const watchSecret = e['WATCH_TOKEN_SECRET'] ?? '';
    if (!watchSecret) {
      console.error('[stripe-webhook] WATCH_TOKEN_SECRET not set — ' + productSlug + ' buyer will receive no watch link');
    } else {
      try { expiringUrls.push(await generateWatchUrl(watchSecret, 'workshop-replay')); }
      catch (err) { console.error('[stripe-webhook] Watch URL signing error:', String(err)); }
    }
  } else if (productSlug === 'greatness') {
    const watchSecret = e['WATCH_TOKEN_SECRET'] ?? '';
    if (watchSecret) {
      try { expiringUrls.push(await generateCommunityMagicLink(watchSecret)); }
      catch (err) {
        console.error('[stripe-webhook] Community magic link error:', String(err));
        expiringUrls.push(`${SITE_URL}/community/inside`);
      }
    } else {
      expiringUrls.push(`${SITE_URL}/community/inside`);
    }
  } else {
    const objectKeys = ASSET_MAP[productSlug] ?? [];
    const r2AccountId = e['R2_ACCOUNT_ID'] ?? '';
    const r2AccessKey = e['R2_ACCESS_KEY_ID'] ?? '';
    const r2SecretKey = e['R2_SECRET_ACCESS_KEY'] ?? '';
    const r2Bucket    = e['R2_BUCKET_NAME'] ?? e['R2_BUCKET'] ?? '';
    if (r2AccountId && r2AccessKey && r2SecretKey && r2Bucket && objectKeys.length > 0) {
      try {
        for (const key of objectKeys) {
          expiringUrls.push(await generateR2PresignedUrl(r2AccountId, r2AccessKey, r2SecretKey, r2Bucket, key));
        }
      } catch (err) { console.error('[stripe-webhook] R2 presign error:', String(err)); }
    }
  }

  // Primary: Resend (direct, no middleman)
  const resendKey = e['RESEND_API_KEY'] ?? '';
  if (resendKey) {
    await sendResendDelivery(resendKey, email, productSlug, expiringUrls, e);
  }

  // Secondary: Make.com webhook (optional — fires if URL is set, for extra automations)
  // expiring_url/expiring_url_2 kept as named fields for backward compatibility with any
  // existing Make.com scenario; expiring_url_3 added for the 3-file Bundle case.
  const deliveryUrl = e['MAKE_DELIVERY_WEBHOOK_URL'] ?? '';
  if (deliveryUrl) {
    try {
      const res = await fetch(deliveryUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email, product_id: productId, product_slug: productSlug, token,
          expiring_url: expiringUrls[0] ?? null,
          expiring_url_2: expiringUrls[1] ?? null,
          expiring_url_3: expiringUrls[2] ?? null,
        }),
      });
      if (!res.ok) console.warn('[stripe-webhook] Make.com delivery responded', res.status);
      else console.log('[stripe-webhook] Make.com delivery success for', productSlug);
    } catch (err) {
      console.error('[stripe-webhook] Make.com delivery error:', String(err));
    }
  }

  if (!resendKey && !deliveryUrl) {
    console.error('[stripe-webhook] FATAL: No delivery method configured. Set RESEND_API_KEY (preferred) or MAKE_DELIVERY_WEBHOOK_URL. Buyer', email, 'purchased', productSlug, 'and received nothing.');
  }
}

// ── handler ────────────────────────────────────────────────────────────────

export async function POST({ request }: APIContext): Promise<Response> {
  const e = cfEnv as unknown as Record<string, string>;
  const webhookSecret = e['STRIPE_WEBHOOK_SECRET'] ?? '';
  const stripeKey     = e['STRIPE_SECRET_KEY'] ?? '';
  const kitKey        = e['KIT_API_KEY'] ?? '';
  const airtableToken = e['AIRTABLE_API_KEY'] ?? '';
  const airtableBase  = e['AIRTABLE_BASE_ID'] ?? '';
  const airtableTable = e['AIRTABLE_TABLE'] ?? 'Members';
  const resendKey     = e['RESEND_API_KEY'] ?? '';

  if (!webhookSecret || !stripeKey) {
    console.error('[stripe-webhook] Missing env vars');
    return new Response('Misconfigured', { status: 500 });
  }

  const rawBody   = await request.text();
  const sigHeader = request.headers.get('stripe-signature') ?? '';
  const webCrypto = Stripe.createSubtleCryptoProvider();

  const stripe = new Stripe(stripeKey, { apiVersion: '2025-04-30.basil', httpClient: Stripe.createFetchHttpClient() });

  let event: Stripe.Event;
  try {
    event = await stripe.webhooks.constructEventAsync(rawBody, sigHeader, webhookSecret, undefined, webCrypto);
  } catch (err) {
    console.warn('[stripe-webhook] Signature verification failed:', String(err));
    return new Response('Invalid signature', { status: 400 });
  }

  // Claim event.id via D1's PRIMARY KEY constraint before doing anything else.
  // Two webhook endpoints are currently registered on the same URL, so every
  // event is delivered twice — this insert is the atomic gate that makes the
  // second delivery a no-op instead of a second run of the full handler.
  const db = (cfEnv as unknown as { WEBHOOK_EVENTS: D1Database }).WEBHOOK_EVENTS;
  try {
    await db
      .prepare('INSERT INTO processed_stripe_events (event_id, event_type, processed_at) VALUES (?, ?, ?)')
      .bind(event.id, event.type, Date.now())
      .run();
  } catch (err) {
    const msg = String(err);
    if (msg.includes('UNIQUE constraint failed')) {
      console.log('[stripe-webhook] duplicate delivery ignored', event.id, event.type);
      return new Response(JSON.stringify({ received: true, duplicate: true }), { status: 200, headers: { 'Content-Type': 'application/json' } });
    }
    // Any other D1 failure is a real infrastructure error — surface it so
    // Stripe retries, rather than silently proceeding unclaimed.
    throw err;
  }

  try {
    // ── initial purchase ────────────────────────────────────────────────────
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session;
      const email   = session.customer_details?.email ?? session.customer_email ?? '';

      let productId = '';
      try {
        const lineItems = await stripe.checkout.sessions.listLineItems(session.id, { expand: ['data.price.product'] });
        const product = lineItems.data[0]?.price?.product;
        if (product && typeof product === 'object' && 'id' in product) {
          productId = (product as Stripe.Product).id;
        }
      } catch (err) { console.error('[stripe-webhook] listLineItems error:', String(err)); }

      if (!email || !productId) {
        console.error('[stripe-webhook] checkout.session.completed missing email or productId', { sessionId: session.id, email: !!email, productId: !!productId });
      } else {
        const slug = PRODUCT_MAP[productId] ?? LOOKUP_KEY_MAP[session.metadata?.lookup_key ?? ''];
        await deliverProduct(email, productId, e, slug);
        // Grade purchase confirmation — deliverProduct() correctly no-ops for
        // grade1/2/3 (no ASSET_MAP entry, it's a call not a file), so this is
        // the actual confirmation + booking email for these three slugs.
        if (slug === 'grade1' || slug === 'grade2' || slug === 'grade3') {
          const gradeName  = GA4_CATALOG[slug]?.name ?? slug;
          const priceCents = session.amount_total ?? null;
          const priceLabel = priceCents != null
            ? `$${(priceCents / 100).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`
            : '';
          await sendGradeConfirmation(resendKey, email, gradeName, priceLabel);
          const coachingTagId = e['KIT_COACHING_TAG_ID'] ?? '';
          if (coachingTagId) {
            await tagKit(kitKey, email, coachingTagId);
          } else {
            console.error('[stripe-webhook] KIT_COACHING_TAG_ID not set — ' + slug + ' buyer ' + email + ' was not tagged in Kit.');
          }
        }
        // Telegram sale alert
        sendTelegramAlert(
          e['TELEGRAM_BOT_TOKEN'] ?? '',
          e['TELEGRAM_CHAT_ID'] ?? '',
          `SALE: ${slug ?? productId}, $${((session.amount_total ?? 0) / 100).toFixed(0)}, ${email.replace(/(.).*(@.*)/, '$1***$2')}`,
        ).catch(() => {});
        // Sync member into Airtable + tag in Kit
        await upsertAirtable(airtableToken, airtableBase, airtableTable, {
          Email: email,
          Name: session.customer_details?.name ?? '',
          Status: 'active',
          Product: slug ?? productId,
          'Stripe Customer': String(session.customer ?? ''),
          'Stripe Subscription': String(session.subscription ?? ''),
        });
        if (slug && KIT_PRODUCT_TAGS[slug]) {
          await tagKit(kitKey, email, KIT_MEMBER_TAG);
          await tagKit(kitKey, email, KIT_PRODUCT_TAGS[slug]);
        }
        // Post-purchase Kit sequences
        if (slug === 'workshop-replay' && KIT_REPLAY_SEQ_ID) {
          await addToKitSequence(kitKey, email, KIT_REPLAY_SEQ_ID);
        }
        if (slug === 'greatness' && KIT_COMMUNITY_SEQ_ID) {
          await addToKitSequence(kitKey, email, KIT_COMMUNITY_SEQ_ID);
        }
        // Bundle buyer nurture sequence
        if (slug === 'bundle' && KIT_BUNDLE_SEQ_ID) {
          await addToKitSequence(kitKey, email, KIT_BUNDLE_SEQ_ID);
        }
        // Start the 14-day Community trial for Blueprint buyers.
        if (slug && BLUEPRINT_TRIAL_SLUGS.has(slug)) {
          if (KIT_TRIAL_TAG_ID) {
            await tagKit(kitKey, email, KIT_TRIAL_TAG_ID);
          } else {
            console.error('[stripe-webhook] FATAL: ' + slug + ' purchased by ' + email + ' but KIT_TRIAL_TAG_ID is empty. Day-0/7/12/14 trial-conversion sequence will NOT fire. Create the tag in Kit (Grow > Tags), copy the numeric ID from app.kit.com/tags/XXXXX, paste into stripe-webhook.ts.');
          }
        }
        // Server-side GA4 purchase event — most accurate revenue signal
        if (slug) {
          const amountCents = session.amount_total ?? null;
          await sendGA4Purchase(e, {
            slug,
            transactionId: session.id,
            customerEmail: email,
            customerStripeId: String(session.customer ?? ''),
            actualValue: amountCents != null ? amountCents / 100 : undefined,
          });
        }
      }
    }

    // ── subscription renewal ────────────────────────────────────────────────
    if (event.type === 'invoice.payment_succeeded') {
      const invoice = event.data.object as Stripe.Invoice;
      if (invoice.billing_reason !== 'subscription_cycle') {
        return new Response(JSON.stringify({ received: true }), { status: 200, headers: { 'Content-Type': 'application/json' } });
      }
      const email = invoice.customer_email ?? '';
      let productId = '';
      const subId = typeof invoice.subscription === 'string' ? invoice.subscription : null;
      if (subId) {
        try {
          const sub = await stripe.subscriptions.retrieve(subId, { expand: ['items.data.price.product'] });
          const product = sub.items.data[0]?.price?.product;
          if (product && typeof product === 'object' && 'id' in product) productId = (product as Stripe.Product).id;
        } catch (err) { console.error('[stripe-webhook] subscription retrieve error:', String(err)); }
      }
      if (email && productId) {
        await deliverProduct(email, productId, e);
        // Subscription renewal — server-side GA4 purchase event
        const slug = PRODUCT_MAP[productId];
        if (slug) {
          const amountCents = invoice.amount_paid ?? null;
          await sendGA4Purchase(e, {
            slug,
            transactionId: invoice.id,
            customerEmail: email,
            customerStripeId: typeof invoice.customer === 'string' ? invoice.customer : '',
            actualValue: amountCents != null ? amountCents / 100 : undefined,
          });
        }
        // E11 — restore active status in Airtable (renewal and payment recovery)
        await upsertAirtable(airtableToken, airtableBase, airtableTable, {
          Email: email,
          Status: 'active',
          'Stripe Customer': typeof invoice.customer === 'string' ? invoice.customer : '',
          'Stripe Subscription': subId ?? '',
        });
        if (kitKey) await tagKit(kitKey, email, KIT_MEMBER_TAG);
      }
    }

    // ── payment failure — E10 ─────────────────────────────────────────────
    if (event.type === 'invoice.payment_failed') {
      const invoice = event.data.object as Stripe.Invoice;
      if (invoice.subscription) {
        const email = invoice.customer_email ?? '';
        const customerId = typeof invoice.customer === 'string' ? invoice.customer : '';
        if (email) {
          await upsertAirtable(airtableToken, airtableBase, airtableTable, {
            Email: email,
            Status: 'payment_failed',
            'Stripe Customer': customerId,
            'Stripe Subscription': typeof invoice.subscription === 'string' ? invoice.subscription : '',
          });
        }
        if (email && resendKey && customerId) {
          let portalUrl = `${SITE_URL}/community`;
          try {
            const portal = await stripe.billingPortal.sessions.create({
              customer: customerId,
              return_url: `${SITE_URL}/community`,
            });
            portalUrl = portal.url;
          } catch (err) {
            console.warn('[stripe-webhook] E10 portal session unavailable, using fallback:', String(err));
          }
          try {
            const emailRes = await fetch('https://api.resend.com/emails', {
              method: 'POST',
              headers: { 'Authorization': `Bearer ${resendKey}`, 'Content-Type': 'application/json' },
              body: JSON.stringify({
                from: 'Thee Rainers <rainers@theerainers.com>',
                to: [email],
                subject: 'Your payment was declined.',
                html: buildPaymentFailedHtml(portalUrl, email),
                headers: {
                  'List-Unsubscribe': `<mailto:rainers@theerainers.com?subject=unsubscribe>, <${SITE_URL}/api/unsubscribe?email=${encodeURIComponent(email)}>`,
                  'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
                },
              }),
            });
            if (!emailRes.ok) console.error('[stripe-webhook] E10 Resend failed', emailRes.status, await emailRes.text());
            else console.log('[stripe-webhook] E10 card-update email sent', email.replace(/(.).*(@.*)/, '$1***$2'));
          } catch (err) {
            console.error('[stripe-webhook] E10 Resend error:', String(err));
          }
        }
      }
    }

    // ── subscription status changes ─────────────────────────────────────────
    if (event.type === 'customer.subscription.updated') {
      const sub = event.data.object as Stripe.Subscription;
      const customer = await stripe.customers.retrieve(String(sub.customer));
      const email = !customer.deleted ? customer.email ?? '' : '';
      const product = sub.items.data[0]?.price?.product;
      const productId = product && typeof product === 'object' && 'id' in product ? (product as Stripe.Product).id : String(product ?? '');
      const slug = PRODUCT_MAP[productId];
      await upsertAirtable(airtableToken, airtableBase, airtableTable, {
        Email: email,
        Status: sub.status,
        Product: slug ?? '',
        'Stripe Customer': String(sub.customer),
        'Stripe Subscription': sub.id,
      });
      if (email) {
        if (sub.status === 'active' || sub.status === 'trialing') {
          await tagKit(kitKey, email, KIT_MEMBER_TAG);
        } else if (sub.status === 'canceled' || sub.status === 'unpaid') {
          await untagKit(kitKey, email, KIT_MEMBER_TAG);
        }
        // past_due / incomplete / incomplete_expired: access preserved while Smart Retries runs
      }
    }

    if (event.type === 'customer.subscription.deleted') {
      const sub = event.data.object as Stripe.Subscription;
      const customer = await stripe.customers.retrieve(String(sub.customer));
      const email = !customer.deleted ? customer.email ?? '' : '';
      await upsertAirtable(airtableToken, airtableBase, airtableTable, {
        Email: email,
        Status: 'canceled',
        'Stripe Customer': String(sub.customer),
        'Stripe Subscription': sub.id,
      });
      if (email) await untagKit(kitKey, email, KIT_MEMBER_TAG);
      // E12 — why-you-left email + win-back Kit sequence
      if (email && resendKey) {
        try {
          const wlRes = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${resendKey}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({
              from: 'Rainers <rainers@theerainers.com>',
              to: [email],
              subject: 'Before you go.',
              html: buildCanceledHtml(email),
              headers: {
                'List-Unsubscribe': `<mailto:rainers@theerainers.com?subject=unsubscribe>, <${SITE_URL}/api/unsubscribe?email=${encodeURIComponent(email)}>`,
                'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
              },
            }),
          });
          if (!wlRes.ok) console.error('[stripe-webhook] E12 email failed', wlRes.status, await wlRes.text());
          else console.log('[stripe-webhook] E12 why-left email sent', email.replace(/(.).*(@.*)/, '$1***$2'));
        } catch (err) {
          console.error('[stripe-webhook] E12 email error:', String(err));
        }
      }
      if (email && kitKey && KIT_WINBACK_SEQ_ID) {
        await addToKitSequence(kitKey, email, KIT_WINBACK_SEQ_ID).catch(() => {});
      }
    }

  } catch (err) {
    console.error('[stripe-webhook] handler error:', String(err));
    // Always 200 — never let downstream failures trigger Stripe retries
  }

  return new Response(JSON.stringify({ received: true }), { status: 200, headers: { 'Content-Type': 'application/json' } });
}
