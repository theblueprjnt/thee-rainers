// POST /api/lead-capture
//
// Environment variables required:
//   MAKE_LEAD_WEBHOOK_URL  — Make.com webhook (resilient path for email delivery)
//   KIT_API_KEY            — Kit (ConvertKit) v4 API key
//   KIT_LEAD_TAG_ID        — Tag ID to apply to all free opt-in leads in Kit
//                            Create in Kit: Grow > Tags > "footwork_lead", copy numeric ID
//   AIRTABLE_API_KEY       — Airtable PAT
//   AIRTABLE_BASE_ID       — Airtable base ID
//   AIRTABLE_LEADS_TABLE   — Airtable table for leads (default: "Leads")
//                            NOTE: "source" field must be Single line text, not Single Select
//   SITE_URL               — production domain, e.g. https://theerainers.com

export const prerender = false;

import type { APIContext } from 'astro';
import { env as cfEnv } from 'cloudflare:workers';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function corsHeaders(origin: string): Record<string, string> {
  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };
}

function jsonResponse(body: unknown, status: number, extra: Record<string, string> = {}): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', ...extra },
  });
}

function redirectResponse(location: string): Response {
  return new Response(null, { status: 302, headers: { Location: location } });
}

// ── Kit v4 helpers ─────────────────────────────────────────────────────────

async function kitFindOrCreate(apiKey: string, email: string, firstName: string): Promise<string | null> {
  let res = await fetch('https://api.kit.com/v4/subscribers', {
    method: 'POST',
    headers: { 'X-Kit-Api-Key': apiKey, 'Content-Type': 'application/json' },
    body: JSON.stringify({ email_address: email, first_name: firstName || undefined }),
  });
  let data: Record<string, unknown> = await res.json().catch(() => ({}));
  const sub = data?.subscriber as Record<string, unknown> | undefined;
  if (sub?.id) return String(sub.id);

  res = await fetch(`https://api.kit.com/v4/subscribers?email_address=${encodeURIComponent(email)}`, {
    headers: { 'X-Kit-Api-Key': apiKey },
  });
  data = await res.json().catch(() => ({}));
  const subs = data?.subscribers as Array<Record<string, unknown>> | undefined;
  return subs?.[0]?.id ? String(subs[0].id) : null;
}

async function kitApplyTag(apiKey: string, email: string, firstName: string, tagId: string): Promise<void> {
  if (!apiKey || !tagId) return;
  const id = await kitFindOrCreate(apiKey, email, firstName);
  if (!id) return;
  await fetch(`https://api.kit.com/v4/tags/${tagId}/subscribers/${id}`, {
    method: 'POST',
    headers: { 'X-Kit-Api-Key': apiKey, 'Content-Type': 'application/json' },
    body: '{}',
  });
}

// ── Airtable helper ────────────────────────────────────────────────────────

async function upsertAirtableLead(
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

export async function OPTIONS(_ctx: APIContext): Promise<Response> {
  const origin = (cfEnv as unknown as Record<string, string>)['SITE_URL'] || 'https://theerainers.com';
  return new Response(null, { status: 204, headers: corsHeaders(origin) });
}

export async function POST({ request }: APIContext): Promise<Response> {
  const e = cfEnv as unknown as Record<string, string>;
  const origin = e['SITE_URL'] || 'https://theerainers.com';
  const headers = corsHeaders(origin);
  const contentType = request.headers.get('content-type') ?? '';
  const isJson = contentType.includes('application/json');

  // ── parse ─────────────────────────────────────────────────────────────
  let full_name = '';
  let email = '';
  let phone = '';
  let source = 'footwork-free';

  try {
    if (isJson) {
      const body = (await request.json()) as Record<string, string>;
      full_name = (body.full_name ?? '').trim();
      email     = (body.email    ?? '').trim();
      phone     = (body.phone    ?? '').trim();
      source    = (body.source   ?? source).trim();
    } else {
      const data = await request.formData();
      full_name = ((data.get('full_name') as string) ?? '').trim();
      email     = ((data.get('email')     as string) ?? '').trim();
      phone     = ((data.get('phone')     as string) ?? '').trim();
      source    = ((data.get('source')    as string) ?? source).trim();
    }
  } catch {
    return isJson
      ? jsonResponse({ success: false, error: 'Malformed request body.' }, 400, headers)
      : redirectResponse('/foundation?error=bad_request');
  }

  // ── validate ──────────────────────────────────────────────────────────
  if (!email || !EMAIL_RE.test(email)) {
    return isJson
      ? jsonResponse({ success: false, error: 'A valid email address is required.' }, 400, headers)
      : redirectResponse('/foundation?error=invalid_email');
  }

  const emailLog = email.replace(/(.).*(@.*)/, '$1***$2');
  console.log('[lead-capture] submission', { source, emailLog });

  // ── Make.com webhook (resilient — never blocks response) ──────────────
  const rawWebhook = (e['MAKE_LEAD_WEBHOOK_URL'] ?? '').trim().replace(/^["']|["']$/g, '');
  let webhookStatus = 'unattempted';

  if (!/^https?:\/\//.test(rawWebhook)) {
    webhookStatus = 'config_missing';
    console.warn('[LEAD_DEFERRED] MAKE_LEAD_WEBHOOK_URL missing or invalid', { source, emailLog });
  } else {
    try {
      const res = await fetch(rawWebhook, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ full_name, email, phone, source }),
        signal: AbortSignal.timeout(8000),
      });
      webhookStatus = res.ok ? 'delivered' : `non_2xx_${res.status}`;
      if (!res.ok) console.warn('[LEAD_DEFERRED] webhook non-2xx', { source, emailLog, status: res.status });
    } catch (err) {
      webhookStatus = 'fetch_failed';
      console.warn('[LEAD_DEFERRED] webhook fetch failed', { source, emailLog, err: String(err) });
    }
  }

  // ── Kit — subscribe + tag (fire-and-forget, never blocks response) ────
  const kitKey   = e['KIT_API_KEY'] ?? '';
  const kitTagId = e['KIT_LEAD_TAG_ID'] ?? '';
  if (kitKey) {
    kitApplyTag(kitKey, email, full_name, kitTagId).catch((err) =>
      console.warn('[lead-capture] Kit tag failed', { emailLog, err: String(err) }),
    );
  }

  // ── Airtable — upsert lead record (fire-and-forget) ──────────────────
  const airtableToken = e['AIRTABLE_API_KEY'] ?? '';
  const airtableBase  = e['AIRTABLE_BASE_ID'] ?? '';
  const airtableTable = e['AIRTABLE_LEADS_TABLE'] ?? 'Leads';
  if (airtableToken && airtableBase) {
    upsertAirtableLead(airtableToken, airtableBase, airtableTable, {
      Email:     email,
      Name:      full_name,
      Source:    source,
      Phone:     phone,
      CreatedAt: new Date().toISOString(),
    }).catch((err) =>
      console.warn('[lead-capture] Airtable upsert failed', { emailLog, err: String(err) }),
    );
  }

  const successHeaders = { ...headers, 'X-Lead-Webhook-Status': webhookStatus };
  return isJson
    ? jsonResponse({ success: true, webhookStatus }, 200, successHeaders)
    : redirectResponse('/thank-you/foundation');
}
