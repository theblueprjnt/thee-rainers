// POST /api/survey
//
// Anonymous product feedback survey submitted from /survey. No email
// collected. Writes one record per submission to Airtable.
//
// Environment variables:
//   AIRTABLE_API_KEY       — Airtable PAT (already set for Leads/Members/etc.)
//   AIRTABLE_BASE_ID       — Airtable base ID (already set)
//   AIRTABLE_SURVEY_TABLE  — table name (default: "Survey_Responses")

export const prerender = false;

import type { APIContext } from 'astro';
import { env as cfEnv } from 'cloudflare:workers';

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

async function createAirtableRecord(
  token: string,
  baseId: string,
  table: string,
  fields: Record<string, unknown>,
): Promise<void> {
  const res = await fetch(`https://api.airtable.com/v0/${baseId}/${encodeURIComponent(table)}`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ records: [{ fields }] }),
  });
  if (!res.ok) {
    console.warn('[survey] Airtable insert failed', { status: res.status, body: await res.text().catch(() => '') });
  }
}

export async function OPTIONS(_ctx: APIContext): Promise<Response> {
  const origin = (cfEnv as unknown as Record<string, string>)['SITE_URL'] || 'https://theerainers.com';
  return new Response(null, { status: 204, headers: corsHeaders(origin) });
}

export async function POST({ request, locals }: APIContext): Promise<Response> {
  const cfCtx = (locals as { cfContext?: { waitUntil(p: Promise<unknown>): void } }).cfContext;
  const waitUntil = cfCtx
    ? (p: Promise<unknown>) => cfCtx.waitUntil(p)
    : (p: Promise<unknown>) => { p.catch(() => {}); };

  const e = cfEnv as unknown as Record<string, string>;
  const origin = e['SITE_URL'] || 'https://theerainers.com';
  const headers = corsHeaders(origin);
  const contentType = request.headers.get('content-type') ?? '';
  const isJson = contentType.includes('application/json');

  // ── parse ────────────────────────────────────────────────────────────
  let product = '';
  let progress = '';
  let stoppedReason = '';
  let keptGoing: string[] = [];
  let oneChange = '';
  let honeypot = '';

  try {
    if (isJson) {
      const body = (await request.json()) as Record<string, unknown>;
      product       = String(body.product ?? '').trim();
      progress      = String(body.progress ?? '').trim();
      stoppedReason = String(body.stopped_reason ?? '').trim();
      keptGoing     = Array.isArray(body.kept_going) ? body.kept_going.map(String) : [];
      oneChange     = String(body.one_change ?? '').trim();
      honeypot      = String(body.website ?? '').trim();
    } else {
      const data = await request.formData();
      product       = ((data.get('product') as string) ?? '').trim();
      progress      = ((data.get('progress') as string) ?? '').trim();
      stoppedReason = ((data.get('stopped_reason') as string) ?? '').trim();
      keptGoing     = data.getAll('kept_going').map(String);
      oneChange     = ((data.get('one_change') as string) ?? '').trim();
      honeypot      = ((data.get('website') as string) ?? '').trim();
    }
  } catch {
    return isJson
      ? jsonResponse({ success: false, error: 'Malformed request body.' }, 400, headers)
      : redirectResponse('/survey?error=bad_request');
  }

  // ── validate ─────────────────────────────────────────────────────────
  if (honeypot) return jsonResponse({ success: true }, 200, headers);

  if (!product || !progress) {
    return isJson
      ? jsonResponse({ success: false, error: 'Please answer the required questions.' }, 400, headers)
      : redirectResponse('/survey?error=missing_fields');
  }

  keptGoing = keptGoing.slice(0, 2);

  console.log('[survey] submission', { product, progress });

  // ── Airtable — one record per submission ────────────────────────────
  const airtableToken = e['AIRTABLE_API_KEY'] ?? '';
  const airtableBase  = e['AIRTABLE_BASE_ID'] ?? '';
  const airtableTable = e['AIRTABLE_SURVEY_TABLE'] ?? 'Survey_Responses';
  if (!airtableToken || !airtableBase) {
    console.warn('[survey] Airtable env vars not set — response will NOT be saved', { product, progress });
  } else {
    waitUntil(
      createAirtableRecord(airtableToken, airtableBase, airtableTable, {
        Product: product,
        Progress: progress,
        'Stopped Reason': stoppedReason,
        'Would Have Kept Going': keptGoing,
        'One Change': oneChange,
        'Submitted At': new Date().toISOString(),
      }).catch((err) => console.warn('[survey] Airtable insert error', String(err))),
    );
  }

  return isJson
    ? jsonResponse({ success: true }, 200, headers)
    : redirectResponse('/thank-you/survey');
}
