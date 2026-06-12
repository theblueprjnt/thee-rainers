// POST /api/lead-capture
//
// Environment variables required:
//   MAKE_LEAD_WEBHOOK_URL  — your Make.com webhook URL
//   SITE_URL               — your production domain, e.g. https://theerainers.com
//
// Set these in:
//   Local dev:         .env  (already gitignored)
//   Cloudflare Pages:  Settings → Environment variables → Add variable

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

export async function OPTIONS(_ctx: APIContext): Promise<Response> {
  const origin = (cfEnv as unknown as Record<string, string>)['SITE_URL'] || 'https://theerainers.com';
  return new Response(null, { status: 204, headers: corsHeaders(origin) });
}

export async function POST({ request }: APIContext): Promise<Response> {
  const origin = (cfEnv as unknown as Record<string, string>)['SITE_URL'] || 'https://theerainers.com';
  const headers = corsHeaders(origin);
  const contentType = request.headers.get('content-type') ?? '';
  const isJson = contentType.includes('application/json');

  // ── parse ────────────────────────────────────────────────────────────
  let full_name = '';
  let email = '';
  let phone = '';
  let source = 'footwork-foundation';

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

  // ── validate ─────────────────────────────────────────────────────────
  if (!email || !EMAIL_RE.test(email)) {
    return isJson
      ? jsonResponse({ success: false, error: 'A valid email address is required.' }, 400, headers)
      : redirectResponse('/foundation?error=invalid_email');
  }

  // ── forward to Make.com webhook ───────────────────────────────────────
  // RESILIENT-BY-DEFAULT. The PDF download fires client-side regardless of
  // this webhook's success. Webhook failure therefore means a CRM/email-list
  // gap, never a broken user experience. We log structured warnings so the
  // gap is observable in CF Pages logs and surface delivery state in the
  // response (success flag + X-Lead-Webhook-Status header), but we never
  // surface a 500 for a webhook problem.
  const rawWebhook = (cfEnv as unknown as Record<string, string>)['MAKE_LEAD_WEBHOOK_URL'] ?? '';
  // Defensive: strip wrapping whitespace + quote characters (a frequent
  // dashboard paste artifact that silently breaks the env var).
  const webhookUrl = rawWebhook.trim().replace(/^["']|["']$/g, '');
  const emailLog = email.replace(/(.).*(@.*)/, '$1***$2');

  let webhookStatus = 'unattempted';

  if (!/^https?:\/\//.test(webhookUrl)) {
    webhookStatus = 'config_missing';
    console.warn('[LEAD_DEFERRED] MAKE_LEAD_WEBHOOK_URL missing or invalid', { source, emailLog });
  } else {
    console.log('[lead-capture] submission', { source, emailLog });
    try {
      const res = await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ full_name, email, phone, source }),
        signal: AbortSignal.timeout(8000),
      });
      if (res.ok) {
        webhookStatus = 'delivered';
      } else {
        webhookStatus = `non_2xx_${res.status}`;
        console.warn('[LEAD_DEFERRED] webhook non-2xx', { source, emailLog, status: res.status });
      }
    } catch (err) {
      webhookStatus = 'fetch_failed';
      console.warn('[LEAD_DEFERRED] webhook fetch failed', { source, emailLog, err: String(err) });
    }
  }

  // Always return success — the PDF download already fired client-side and the
  // user's job is done. Webhook diagnostics are exposed in a header for ops.
  const successHeaders = { ...headers, 'X-Lead-Webhook-Status': webhookStatus };
  return isJson
    ? jsonResponse({ success: true, webhookStatus }, 200, successHeaders)
    : redirectResponse('/thank-you/foundation');
}
