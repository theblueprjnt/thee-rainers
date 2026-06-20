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
import { sendTelegramAlert } from '../../lib/telegram';

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

  const emailLog = email.replace(/(.).*(@.*)/, '$1***$2');
  console.log('[contact] submission', { reason, emailLog });

  // ── Telegram alert (fire-and-forget) ─────────────────────────────────
  const e = cfEnv as unknown as Record<string, string>;
  sendTelegramAlert(
    e['TELEGRAM_BOT_TOKEN'] ?? '',
    e['TELEGRAM_CHAT_ID'] ?? '',
    `CONTACT FORM\nReason: ${reason}\nName: ${full_name}\nEmail: ${emailLog}\n\n${message.slice(0, 200)}${message.length > 200 ? '…' : ''}`,
  ).catch(() => {});

  // ── Resend notification to Rainers (primary) ──────────────────────────
  const resendKey = e['RESEND_API_KEY'] ?? '';
  let delivered = false;
  if (resendKey) {
    try {
      const html =
        `<div style="font-family:monospace;max-width:600px;margin:0 auto;padding:32px 24px;color:#0A0A0A;">` +
        `<p style="font-size:11px;letter-spacing:0.12em;text-transform:uppercase;color:#888;margin:0 0 24px;">Contact Form</p>` +
        `<p style="font-size:18px;font-weight:700;margin:0 0 24px;">${reason}</p>` +
        `<table style="width:100%;border-collapse:collapse;margin:0 0 24px;">` +
        `<tr><td style="padding:10px 0;border-bottom:1px solid #eee;font-size:11px;text-transform:uppercase;color:#888;width:25%;">Name</td><td style="padding:10px 0;border-bottom:1px solid #eee;font-size:14px;">${full_name}</td></tr>` +
        `<tr><td style="padding:10px 0;border-bottom:1px solid #eee;font-size:11px;text-transform:uppercase;color:#888;">Email</td><td style="padding:10px 0;border-bottom:1px solid #eee;font-size:14px;"><a href="mailto:${email}" style="color:#0057FF;">${email}</a></td></tr>` +
        `<tr><td style="padding:10px 0;border-bottom:1px solid #eee;font-size:11px;text-transform:uppercase;color:#888;">Phone</td><td style="padding:10px 0;border-bottom:1px solid #eee;font-size:14px;">${phone}</td></tr>` +
        `<tr><td style="padding:10px 0;font-size:11px;text-transform:uppercase;color:#888;vertical-align:top;">Message</td><td style="padding:10px 0;font-size:14px;line-height:1.6;">${message.replace(/\n/g, '<br/>')}</td></tr>` +
        `</table>` +
        `<p style="margin:0;"><a href="mailto:${email}" style="display:inline-block;background:#0057FF;color:#fff;font-family:monospace;font-size:13px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;text-decoration:none;padding:14px 28px;">Reply</a></p>` +
        `</div>`;
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: { Authorization: `Bearer ${resendKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          from: 'Thee Rainers <rainers@theerainers.com>',
          to: ['rainers@theerainers.com'],
          reply_to: email,
          subject: `${reason} — ${full_name}`,
          html,
        }),
      });
      if (res.ok) { delivered = true; }
      else { console.error('[contact] Resend failed', res.status, await res.text()); }
    } catch (err) {
      console.error('[contact] Resend fetch error:', String(err));
    }
  }

  // ── Make.com webhook (secondary) ─────────────────────────────────────
  const webhookUrl = (e['MAKE_CONTACT_WEBHOOK_URL'] ?? '').trim();
  if (/^https?:\/\//.test(webhookUrl)) {
    fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ full_name, email, phone, reason, message }),
    }).catch((err) => console.warn('[contact] Make.com failed:', String(err)));
  } else if (!delivered) {
    console.error('[contact] FATAL: No delivery method configured. RESEND_API_KEY missing and MAKE_CONTACT_WEBHOOK_URL invalid. Message from', emailLog, 'lost.');
    return isJson
      ? jsonResponse({ success: false, error: 'Server config error. Email rainers@theerainers.com directly.' }, 500, headers)
      : redirectResponse('/contact?error=config_error');
  }

  // ── success ───────────────────────────────────────────────────────────
  return isJson
    ? jsonResponse({ success: true }, 200, headers)
    : redirectResponse('/thank-you/contact');
}
