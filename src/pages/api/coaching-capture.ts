export const prerender = false;

import type { APIContext } from 'astro';
import { env as cfEnv } from 'cloudflare:workers';
export async function POST({ request }: APIContext): Promise<Response> {
  const e = cfEnv as unknown as Record<string, string>;

  let data: Record<string, unknown>;
  try {
    data = await request.json() as Record<string, unknown>;
  } catch {
    return new Response(JSON.stringify({ status: 'error', error: 'Invalid JSON' }), { status: 400 });
  }

  const name   = String(data.name   ?? '').trim();
  const email  = String(data.email  ?? '').trim();
  const record = String(data.record ?? '').trim();
  const flaw   = String(data.flaw   ?? '').trim();
  const goal   = String(data.goal   ?? '').trim();

  if (!email) {
    return new Response(JSON.stringify({ status: 'error', error: 'Email required.' }), { status: 400 });
  }

  const emailLog = email.replace(/(.).*(@.*)/, '$1***$2');
  console.log('[coaching-capture] submission', { emailLog });

  // ── Resend notification to Rainers (full application) ─────────────────
  const resendKey = e['RESEND_API_KEY'] ?? '';
  if (resendKey) {
    const html =
      `<div style="font-family:monospace;max-width:600px;margin:0 auto;padding:32px 24px;color:#0A0A0A;">` +
      `<p style="font-size:11px;letter-spacing:0.12em;text-transform:uppercase;color:#888;margin:0 0 24px;">1-on-1 Coaching Application</p>` +
      `<p style="font-size:18px;font-weight:700;margin:0 0 24px;">New application from ${name || email}</p>` +
      `<table style="width:100%;border-collapse:collapse;margin:0 0 24px;">` +
      `<tr><td style="padding:10px 0;border-bottom:1px solid #eee;font-size:11px;text-transform:uppercase;color:#888;width:30%;">Name</td><td style="padding:10px 0;border-bottom:1px solid #eee;font-size:14px;">${name || '—'}</td></tr>` +
      `<tr><td style="padding:10px 0;border-bottom:1px solid #eee;font-size:11px;text-transform:uppercase;color:#888;">Email</td><td style="padding:10px 0;border-bottom:1px solid #eee;font-size:14px;"><a href="mailto:${email}" style="color:#E11D2A;">${email}</a></td></tr>` +
      `<tr><td style="padding:10px 0;border-bottom:1px solid #eee;font-size:11px;text-transform:uppercase;color:#888;vertical-align:top;">Record</td><td style="padding:10px 0;border-bottom:1px solid #eee;font-size:14px;line-height:1.6;">${record || '—'}</td></tr>` +
      `<tr><td style="padding:10px 0;border-bottom:1px solid #eee;font-size:11px;text-transform:uppercase;color:#888;vertical-align:top;">Flaw</td><td style="padding:10px 0;border-bottom:1px solid #eee;font-size:14px;line-height:1.6;">${flaw || '—'}</td></tr>` +
      `<tr><td style="padding:10px 0;font-size:11px;text-transform:uppercase;color:#888;vertical-align:top;">Goal</td><td style="padding:10px 0;font-size:14px;line-height:1.6;">${goal || '—'}</td></tr>` +
      `</table>` +
      `<p style="margin:0;"><a href="mailto:${email}" style="display:inline-block;background:#7C3AED;color:#fff;font-family:monospace;font-size:13px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;text-decoration:none;padding:14px 28px;">Reply to Applicant</a></p>` +
      `</div>`;
    fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${resendKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: 'Thee Rainers <rainers@theerainers.com>',
        to: ['rainers@theerainers.com'],
        reply_to: email,
        subject: `Application: ${name || email}`,
        html,
      }),
    }).catch((err) => console.error('[coaching-capture] Resend failed:', String(err)));
  } else {
    console.warn('[coaching-capture] RESEND_API_KEY not set — Rainers will not receive email notification');
  }

  // ── Make.com webhook (secondary — fire-and-forget) ────────────────────
  const webhookUrl = (e['MAKE_LEAD_WEBHOOK_URL'] ?? '').trim();
  if (/^https?:\/\//.test(webhookUrl)) {
    fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...data, source: 'coaching-capture' }),
    }).catch((err) => console.warn('[coaching-capture] Make.com failed:', String(err)));
  }

  // ── Kit tagging — mark applicant for coaching follow-up sequence ───────
  // Create tag in Kit (Grow > Tags → "coaching_applicant"), paste numeric ID
  // from the URL (app.kit.com/tags/XXXXX) into KIT_COACHING_TAG_ID env var.
  const kitKey       = e['KIT_API_KEY'] ?? '';
  const coachingTag  = e['KIT_COACHING_TAG_ID'] ?? '';
  if (kitKey && coachingTag) {
    (async () => {
      try {
        // find-or-create subscriber
        let res = await fetch('https://api.kit.com/v4/subscribers', {
          method: 'POST',
          headers: { 'X-Kit-Api-Key': kitKey, 'Content-Type': 'application/json' },
          body: JSON.stringify({ email_address: email, first_name: name || undefined }),
        });
        let d = await res.json().catch(() => ({})) as Record<string, unknown>;
        let subId: string | null = (d?.subscriber as Record<string, unknown> | undefined)?.id
          ? String((d.subscriber as Record<string, unknown>).id)
          : null;
        if (!subId) {
          res = await fetch(`https://api.kit.com/v4/subscribers?email_address=${encodeURIComponent(email)}`, {
            headers: { 'X-Kit-Api-Key': kitKey },
          });
          d = await res.json().catch(() => ({})) as Record<string, unknown>;
          const subs = d?.subscribers as Array<Record<string, unknown>> | undefined;
          subId = subs?.[0]?.id ? String(subs[0].id) : null;
        }
        if (subId) {
          await fetch(`https://api.kit.com/v4/tags/${coachingTag}/subscribers/${subId}`, {
            method: 'POST',
            headers: { 'X-Kit-Api-Key': kitKey, 'Content-Type': 'application/json' },
            body: '{}',
          });
          console.log('[coaching-capture] Kit tagged applicant', emailLog);
        }
      } catch (err) {
        console.warn('[coaching-capture] Kit tagging failed:', String(err));
      }
    })();
  } else if (!kitKey) {
    console.warn('[coaching-capture] KIT_API_KEY not set — applicant not tagged in Kit');
  } else if (!coachingTag) {
    console.warn('[coaching-capture] KIT_COACHING_TAG_ID not set — applicant not tagged in Kit');
  }

  return new Response(JSON.stringify({ status: 'success' }), { status: 200 });
}
