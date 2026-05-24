// POST /api/contact
//
// Environment variables required:
//   MAKE_CONTACT_WEBHOOK_URL — your Make.com webhook URL for contact submissions
//   SITE_URL                 — your production domain, e.g. https://theerainers.com
//
// Set these in:
//   Local dev:         .env  (already gitignored)
//   Cloudflare Pages:  Settings → Environment variables → Add variable
//
// The recipient email address is configured inside Make.com, not in this code.

export const prerender = false;

import type { APIContext } from 'astro';
import { env as cfEnv } from 'cloudflare:workers';

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
  let reason = '';
  let message = '';

  try {
    if (isJson) {
      const body = (await request.json()) as Record<string, string>;
      full_name = (body.full_name ?? '').trim();
      email     = (body.email    ?? '').trim();
      phone     = (body.phone    ?? '').trim();
      reason    = (body.reason   ?? '').trim();
      message   = (body.message  ?? '').trim();
    } else {
      const data = await request.formData();
      full_name = ((data.get('full_name') as string) ?? '').trim();
      email     = ((data.get('email')     as string) ?? '').trim();
      phone     = ((data.get('phone')     as string) ?? '').trim();
      reason    = ((data.get('reason')    as string) ?? '').trim();
      message   = ((data.get('message')   as string) ?? '').trim();
    }
  } catch {
    return isJson
      ? jsonResponse({ success: false, error: 'Malformed request body.' }, 400, headers)
      : redirectResponse('/contact?error=bad_request');
  }

  // ── validate ─────────────────────────────────────────────────────────
  if (!full_name || !email || !phone || !reason || !message) {
    return isJson
      ? jsonResponse({ success: false, error: 'All fields are required.' }, 400, headers)
      : redirectResponse('/contact?error=missing_fields');
  }

  if (!EMAIL_RE.test(email)) {
    return isJson
      ? jsonResponse({ success: false, error: 'A valid email address is required.' }, 400, headers)
      : redirectResponse('/contact?error=invalid_email');
  }

  if (phoneDigits(phone) < 7) {
    return isJson
      ? jsonResponse({ success: false, error: 'A valid phone number is required.' }, 400, headers)
      : redirectResponse('/contact?error=invalid_phone');
  }

  // ── forward to Make.com webhook ───────────────────────────────────────
  // Skipped gracefully when MAKE_CONTACT_WEBHOOK_URL is a placeholder or unset.
  const webhookUrl = (cfEnv as unknown as Record<string, string>)['MAKE_CONTACT_WEBHOOK_URL'] ?? '';
  if (/^https?:\/\//.test(webhookUrl)) {
    try {
      const res = await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ full_name, email, phone, reason, message }),
      });
      if (!res.ok) throw new Error(`Webhook responded with ${res.status}`);
    } catch (err) {
      console.error('[contact] webhook error:', err);
      return isJson
        ? jsonResponse({ success: false, error: 'Delivery failed. Please try again.' }, 500, headers)
        : redirectResponse('/contact?error=delivery_failed');
    }
  }

  // ── success ───────────────────────────────────────────────────────────
  return isJson
    ? jsonResponse({ success: true }, 200, headers)
    : redirectResponse('/thank-you/contact');
}
