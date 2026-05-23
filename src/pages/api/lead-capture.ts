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

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function phoneDigits(phone: string): number {
  return (phone.match(/\d/g) ?? []).length;
}

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
  const origin = import.meta.env.SITE_URL || 'https://theerainers.com';
  return new Response(null, { status: 204, headers: corsHeaders(origin) });
}

export async function POST({ request }: APIContext): Promise<Response> {
  const origin = import.meta.env.SITE_URL || 'https://theerainers.com';
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
      : redirectResponse('/footwork-foundation?error=bad_request');
  }

  // ── validate ─────────────────────────────────────────────────────────
  if (!email || !EMAIL_RE.test(email)) {
    return isJson
      ? jsonResponse({ success: false, error: 'A valid email address is required.' }, 400, headers)
      : redirectResponse('/footwork-foundation?error=invalid_email');
  }

  if (!phone || phoneDigits(phone) < 7) {
    return isJson
      ? jsonResponse({ success: false, error: 'A valid phone number is required.' }, 400, headers)
      : redirectResponse('/footwork-foundation?error=invalid_phone');
  }

  // ── forward to Make.com webhook ───────────────────────────────────────
  // Skipped gracefully when MAKE_LEAD_WEBHOOK_URL is a placeholder or unset.
  const webhookUrl = import.meta.env.MAKE_LEAD_WEBHOOK_URL ?? '';
  if (/^https?:\/\//.test(webhookUrl)) {
    try {
      const res = await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ full_name, email, phone, source }),
      });
      if (!res.ok) throw new Error(`Webhook responded with ${res.status}`);
    } catch (err) {
      console.error('[lead-capture] webhook error:', err);
      return isJson
        ? jsonResponse({ success: false, error: 'Delivery failed. Please try again.' }, 500, headers)
        : redirectResponse('/footwork-foundation?error=delivery_failed');
    }
  }

  // ── success ───────────────────────────────────────────────────────────
  return isJson
    ? jsonResponse({ success: true }, 200, headers)
    : redirectResponse('/thank-you/footwork-foundation');
}
