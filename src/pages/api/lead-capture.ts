import { WORKSHOP_DATE_LONG, WORKSHOP_DATE_SHORT } from '../../data/workshop.ts';

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
//   TELEGRAM_BOT_TOKEN     — Telegram bot token from @BotFather
//   TELEGRAM_CHAT_ID       — Your personal Telegram chat ID (get via @userinfobot)

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

// ── Resend welcome email ───────────────────────────────────────────────────

// Funnel map appended to every welcome email — shows what exists, lets them self-select.
const FUNNEL_MAP = `
<div style="border-top:1px solid #eee;margin:32px 0 0;padding:32px 0 0;">
  <p style="font-size:11px;letter-spacing:0.12em;text-transform:uppercase;color:#aaa;margin:0 0 20px;">What else is available</p>
  <table style="width:100%;border-collapse:collapse;">
    <tr>
      <td style="padding:12px 0;border-bottom:1px solid #f0f0f0;vertical-align:top;width:60%;">
        <p style="font-size:13px;font-weight:700;color:#0A0A0A;margin:0 0 2px;">Workshop Replay</p>
        <p style="font-size:12px;color:#888;margin:0;">90 minutes on demand. Defense mechanics from the ground up.</p>
      </td>
      <td style="padding:12px 0 12px 16px;border-bottom:1px solid #f0f0f0;vertical-align:middle;text-align:right;">
        <a href="https://theerainers.com/workshop-replay" style="font-family:monospace;font-size:11px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:#0057FF;text-decoration:none;">$47 →</a>
      </td>
    </tr>
    <tr>
      <td style="padding:12px 0;border-bottom:1px solid #f0f0f0;vertical-align:top;">
        <p style="font-size:13px;font-weight:700;color:#0A0A0A;margin:0 0 2px;">Blueprint Bundle</p>
        <p style="font-size:12px;color:#888;margin:0;">Footwork and shadowboxing. Both systems together.</p>
      </td>
      <td style="padding:12px 0 12px 16px;border-bottom:1px solid #f0f0f0;vertical-align:middle;text-align:right;">
        <a href="https://theerainers.com/vault" style="font-family:monospace;font-size:11px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:#0057FF;text-decoration:none;">$87 →</a>
      </td>
    </tr>
    <tr>
      <td style="padding:12px 0;vertical-align:top;">
        <p style="font-size:13px;font-weight:700;color:#0A0A0A;margin:0 0 2px;">1-on-1 Coaching</p>
        <p style="font-size:12px;color:#888;margin:0;">Built around your training. Your fight, your body, your timeline.</p>
      </td>
      <td style="padding:12px 0 12px 16px;vertical-align:middle;text-align:right;">
        <a href="https://theerainers.com/command" style="font-family:monospace;font-size:11px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:#6A0DAD;text-decoration:none;">Apply →</a>
      </td>
    </tr>
  </table>
</div>`;

const WELCOME_CONFIG: Record<string, { subject: string; body: string }> = {
  'footwork-foundation': {
    subject: 'the signal you\'re ignoring',
    body: `<p style="font-size:14px;line-height:1.8;color:#0A0A0A;margin:0 0 20px;">A lot of the damage you take in training is damage you do not have to take. The simpler way starts before the cause has happened. The same applies to boxing.</p>
<p style="font-size:14px;line-height:1.8;color:#0A0A0A;margin:0 0 20px;">You do not have to block a punch you are not in front of. Defense starts with distance. A small step, a couple inches, and the world's hardest punch can't hit you. It takes less effort than defending and dealing with potential damage.</p>
<p style="font-size:14px;line-height:1.8;color:#0A0A0A;margin:0 0 28px;">This is a fundamental principle we train to develop control in boxing. Your hands are the last line of defense.</p>
<p style="margin:0 0 28px;"><a href="https://theerainers.com/pdfs/footwork-foundation.pdf" style="display:inline-block;background:#0057FF;color:#fff;font-family:monospace;font-size:13px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;text-decoration:none;padding:14px 28px;">Download Your Protocol →</a></p>
<p style="font-size:14px;line-height:1.8;color:#0A0A0A;margin:0 0 8px;">Reply to this email and tell me: <strong>what would change in your training if you never had to worry about getting hit?</strong></p>
<p style="font-size:13px;color:#888;margin:0 0 4px;">I read these.</p>
<p style="font-size:13px;color:#888;margin:0;">Train well,<br/>Rainers</p>
${FUNNEL_MAP}`,
  },
  'lever-audit': {
    subject: 'Your 7-Lever Audit',
    body: `<p style="font-size:14px;line-height:1.8;color:#0A0A0A;margin:0 0 20px;">Your 7-Lever Self-Assessment is ready.</p>
<p style="font-size:14px;line-height:1.8;color:#555;margin:0 0 24px;">Seven levers. One broken lever limits performance across all the others. Find yours.</p>
<p style="margin:0 0 24px;"><a href="https://theerainers.com/pdfs/lever-audit.pdf" style="display:inline-block;background:#0057FF;color:#fff;font-family:monospace;font-size:13px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;text-decoration:none;padding:14px 28px;">Download Audit →</a></p>
<p style="font-size:13px;color:#888;margin:0 0 4px;">Work through each lever honestly. Score what you actually see in sparring, not what you wish was true.</p>
<p style="font-size:13px;color:#888;margin:0 0 4px;">Train well,</p>
<p style="font-size:13px;color:#888;margin:0;">Rainers</p>
${FUNNEL_MAP}`,
  },
  'lever-audit-quiz': {
    subject: 'Your lever audit results',
    body: `<p style="font-size:14px;line-height:1.8;color:#0A0A0A;margin:0 0 20px;">You completed the 7-Lever Audit.</p>
<p style="font-size:14px;line-height:1.8;color:#555;margin:0 0 24px;">Now you know which lever is limiting everything else. That gap is where the work starts.</p>
<p style="font-size:13px;color:#888;margin:0 0 4px;">Train well,</p>
<p style="font-size:13px;color:#888;margin:0;">Rainers</p>
${FUNNEL_MAP}`,
  },
  'qa-registration': {
    subject: 'Monthly Q&A — you are in',
    body: `<p style="font-size:14px;line-height:1.8;color:#0A0A0A;margin:0 0 20px;">You are registered for the Monthly Q&amp;A.</p>
<p style="font-size:14px;line-height:1.8;color:#555;margin:0 0 24px;">Bring a specific question. The more specific you are about your mechanical problem, the more precise the diagnosis.</p>
<p style="font-size:13px;color:#888;margin:0 0 4px;">The link and time will come closer to the session date.</p>
<p style="font-size:13px;color:#888;margin:0 0 4px;">Train well,</p>
<p style="font-size:13px;color:#888;margin:0;">Rainers</p>
${FUNNEL_MAP}`,
  },
  'footwork-blueprint': {
    subject: 'Your Blueprint. Start on page 9.',
    body: `<p style="font-size:14px;line-height:1.8;color:#0A0A0A;margin:0 0 20px;">The PDF arrived with your download confirmation. If you missed it, it is also here: <a href="https://theerainers.com/pdfs/foundation.pdf" style="color:#0057FF;">The Footwork Blueprint</a></p>
<p style="font-size:14px;line-height:1.8;color:#0A0A0A;margin:0 0 20px;">There are 56 rounds in the blueprint. Most people start on page 1. Page 9 is where the base work begins.</p>
<p style="font-size:14px;line-height:1.8;color:#0A0A0A;margin:0 0 20px;">Work through the stance and balance drills before anything else. Not because the opening pages are wrong. Because everything in the drills compounds only when the base they build on is stable.</p>
<p style="font-size:14px;line-height:1.8;color:#0A0A0A;margin:0 0 28px;">One thing to notice as you go through it: most of what the blueprint corrects is not complex. The issues are structural - stance breaks, being off-balance and movement without intention. They are pattern problems. Humans can change patterns with the right repetitions.</p>
<p style="font-size:14px;line-height:1.8;color:#0A0A0A;margin:0 0 20px;">The full sequence is 30 days. Run it from the base forward.</p>
<p style="margin:0 0 28px;"><a href="https://www.loom.com/share/5dcc29c1138645858c2a100cb2fd1350?sid=875dcfa4-96c0-411d-8548-0655d993cfb4" style="display:inline-block;background:#0057FF;color:#fff;font-family:monospace;font-size:13px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;text-decoration:none;padding:14px 28px;">Watch the 11-min Breakdown →</a></p>
<p style="font-size:13px;color:#888;margin:0 0 4px;">Train well,</p>
<p style="font-size:13px;color:#888;margin:0;">Rainers</p>
${FUNNEL_MAP}`,
  },
  'safe-boxing': {
    subject: 'You are on the list.',
    body: `<p style="font-size:14px;line-height:1.8;color:#0A0A0A;margin:0 0 20px;">You are on the list. We will reach out when resources for parents, coaches, and gym owners open.</p>
<p style="font-size:14px;line-height:1.8;color:#0A0A0A;margin:0 0 28px;">If there is a specific situation you are navigating right now, reply to this email. I read these.</p>
<p style="font-size:13px;color:#888;margin:0;">Rainers</p>`,
  },
};

// ── Sequence emails — add here as Rainers writes them ─────────────────────
// delayDays: how many days after opt-in this email sends
const SEQUENCE: Array<{ delayDays: number; subject: string; preview: string; body: string }> = [
  {
    delayDays: 2,
    subject: 'why I started training this way',
    preview: '',
    body: `<p style="font-size:14px;line-height:1.8;color:#0A0A0A;margin:0 0 20px;">I won my last 3 fights without a coach in my corner. Prior to that I trained with a group coach and competition was always confusing for me. I thought intensity = key, until I left group training for boxing growth and less damage inflicted on the body and brain.</p>
<p style="font-size:14px;line-height:1.8;color:#0A0A0A;margin:0 0 20px;">When I prepped for my first fight I had so many things on my mind as you gather different opinions and information along your boxing journey. All I knew was footwork mattered. So I found a coach and trained that way. I won the fight in a simple fashion simply outboxing my opponent and knocking him down twice.</p>
<p style="font-size:14px;line-height:1.8;color:#0A0A0A;margin:0 0 28px;">Whether you train for health, skill or performance — essentially you're looking for control, not intensity or "hitting harder". Over the next couple of weeks I'll break down the fundamentals and bring you clarity and control both inside and outside the ring.</p>
<p style="font-size:14px;line-height:1.8;color:#0A0A0A;margin:0 0 8px;">I always read replies — tell me: <strong>what made you start boxing?</strong></p>
<p style="font-size:13px;color:#888;margin:0 0 4px;">Train well,</p>
<p style="font-size:13px;color:#888;margin:0;">Rainers</p>
${FUNNEL_MAP}`,
  },
  {
    delayDays: 5,
    subject: 'The Footwork Blueprint (Control Inside Ring)',
    preview: 'This is where the control starts',
    body: `<p style="font-size:14px;font-weight:700;color:#0A0A0A;margin:0 0 20px;">The Footwork Blueprint.</p>
<p style="font-size:14px;line-height:1.8;color:#0A0A0A;margin:0 0 20px;">Control in the ring starts from the ground up. I built this around 4 main footwork bases and over 56 rounds of drills. I used this to prepare for my first fight without a coach — I ended up winning using simple positioning and a jab, scoring 2 knockdowns.</p>
<p style="font-size:14px;line-height:1.8;color:#0A0A0A;margin:0 0 24px;">Here's a breakdown of the 4 bases.</p>
<p style="margin:0 0 28px;"><a href="https://www.loom.com/share/5dcc29c1138645858c2a100cb2fd1350?sid=875dcfa4-96c0-411d-8548-0655d993cfb4" style="display:inline-block;background:#0057FF;color:#fff;font-family:monospace;font-size:13px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;text-decoration:none;padding:14px 28px;">WATCH THE BREAKDOWN →</a></p>
<p style="font-size:13px;color:#888;margin:0 0 4px;">Train well,</p>
<p style="font-size:13px;color:#888;margin:0;">Rainers</p>
${FUNNEL_MAP}`,
  },
  {
    delayDays: 4,
    subject: 'the session is recorded',
    preview: '90 minutes on defense. On demand.',
    body: `<p style="font-size:14px;line-height:1.8;color:#0A0A0A;margin:0 0 20px;">The defense workshop is recorded and available now.</p>
<p style="font-size:14px;line-height:1.8;color:#0A0A0A;margin:0 0 20px;">90 minutes. The 5 layers of defense. How to position with your opponent to hit and not get hit. The full live Q&amp;A from fighters in the session is included — the questions they asked are probably the ones you have.</p>
<p style="font-size:14px;line-height:1.8;color:#0A0A0A;margin:0 0 24px;">If your movement breaks down in sparring, the break is almost always in your stance or your distance before pressure even comes. The session works through that from the base up.</p>
<p style="margin:0 0 12px;"><a href="https://theerainers.com/workshop-replay" style="display:inline-block;background:#0057FF;color:#fff;font-family:monospace;font-size:13px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;text-decoration:none;padding:14px 28px;">GET THE REPLAY · $47 →</a></p>
<p style="font-size:12px;color:#aaa;margin:0 0 28px;">7-day access from purchase. Watch it when you're ready.</p>
<p style="font-size:13px;color:#888;margin:0 0 4px;">Train well,</p>
<p style="font-size:13px;color:#888;margin:0;">Rainers</p>`,
  },
  {
    delayDays: 8,
    subject: 'how to defend yourself',
    preview: '',
    body: `<p style="font-size:14px;line-height:1.8;color:#0A0A0A;margin:0 0 20px;">The first question I get asked after people learn footwork is: how do I defend myself? I'm not letting my hands go in sparring, because I'm afraid I'll get countered or hit.</p>
<p style="font-size:14px;line-height:1.8;color:#0A0A0A;margin:0 0 20px;">I'm running a live workshop on ${WORKSHOP_DATE_LONG} teaching defense and the 5 layers of defense in boxing. Learn to defend yourself on all 5 levels, how to use each to position yourself with the opponent to hit and not get hit.</p>
<p style="font-size:14px;line-height:1.8;color:#0A0A0A;margin:0 0 24px;">If you're still flinching or getting hit more than 3 times per round when sparring — reserve your spot below.</p>
<p style="margin:0 0 16px;"><a href="https://theerainers.com/workshop" style="display:inline-block;background:#0057FF;color:#fff;font-family:monospace;font-size:13px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;text-decoration:none;padding:14px 28px;">RESERVE MY SPOT · $197 →</a></p>
<p style="font-size:12px;color:#aaa;margin:0 0 24px;">Live · ${WORKSHOP_DATE_SHORT} · 12PM ET</p>
<p style="font-size:14px;color:#0A0A0A;margin:0 0 8px;">Can't make ${WORKSHOP_DATE_SHORT}? The full session is already recorded.</p>
<p style="margin:0 0 28px;"><a href="https://theerainers.com/workshop-replay" style="font-family:monospace;font-size:12px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:#0057FF;text-decoration:none;">GET THE REPLAY · $47 →</a></p>
<p style="font-size:13px;color:#888;margin:0 0 4px;">Train well,</p>
<p style="font-size:13px;color:#888;margin:0;">Rainers</p>`,
  },
];

function wrapEmail(body: string): string {
  return `<div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;max-width:560px;margin:0 auto;padding:40px 24px;color:#0A0A0A;background:#ffffff;">${body}</div>`;
}

async function sendResendWelcome(resendKey: string, email: string, source: string): Promise<void> {
  const cfg = WELCOME_CONFIG[source];
  if (!resendKey || !cfg) return;

  // Immediate welcome email
  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${resendKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from: 'Rainers <rainers@theerainers.com>', to: [email], subject: cfg.subject, html: wrapEmail(cfg.body) }),
    });
    if (!res.ok) console.error('[lead-capture] Resend welcome failed', res.status, await res.text());
    else console.log('[lead-capture] Resend welcome sent', { source });
  } catch (err) {
    console.error('[lead-capture] Resend welcome fetch error:', String(err));
  }

  // Schedule sequence emails — fires at opt-in, Resend delivers on schedule
  for (const seq of SEQUENCE) {
    const scheduledAt = new Date(Date.now() + seq.delayDays * 24 * 60 * 60 * 1000).toISOString();
    fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${resendKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from: 'Rainers <rainers@theerainers.com>', to: [email], subject: seq.subject, html: wrapEmail((seq.preview ? `<div style="display:none;max-height:0;overflow:hidden;">${seq.preview}</div>` : '') + seq.body), scheduled_at: scheduledAt }),
    }).then(async r => {
      if (!r.ok) console.error('[lead-capture] Resend schedule failed day', seq.delayDays, r.status, await r.text());
      else console.log('[lead-capture] Resend scheduled day', seq.delayDays, 'for', email);
    }).catch(err => console.error('[lead-capture] Resend schedule error:', String(err)));
  }

}

// ── Kit v4 helpers ─────────────────────────────────────────────────────────

async function kitFindOrCreate(apiKey: string, email: string, firstName: string): Promise<string | null> {
  const createRes = await fetch('https://api.kit.com/v4/subscribers', {
    method: 'POST',
    headers: { 'X-Kit-Api-Key': apiKey, 'Content-Type': 'application/json' },
    body: JSON.stringify({ email_address: email, first_name: firstName || undefined }),
  });
  if (!createRes.ok) {
    console.warn('[lead-capture] Kit create subscriber failed', { status: createRes.status, body: await createRes.text().catch(() => '') });
  } else {
    const data = await createRes.json().catch(() => ({})) as Record<string, unknown>;
    const sub = data?.subscriber as Record<string, unknown> | undefined;
    if (sub?.id) return String(sub.id);
  }

  const lookupRes = await fetch(`https://api.kit.com/v4/subscribers?email_address=${encodeURIComponent(email)}`, {
    headers: { 'X-Kit-Api-Key': apiKey },
  });
  if (!lookupRes.ok) {
    console.warn('[lead-capture] Kit lookup subscriber failed', { status: lookupRes.status, body: await lookupRes.text().catch(() => '') });
    return null;
  }
  const lookupData = await lookupRes.json().catch(() => ({})) as Record<string, unknown>;
  const subs = lookupData?.subscribers as Array<Record<string, unknown>> | undefined;
  return subs?.[0]?.id ? String(subs[0].id) : null;
}

async function kitApplyTag(apiKey: string, email: string, firstName: string, tagId: string): Promise<void> {
  if (!apiKey || !tagId) return;
  const id = await kitFindOrCreate(apiKey, email, firstName);
  if (!id) return;
  const res = await fetch(`https://api.kit.com/v4/tags/${tagId}/subscribers/${id}`, {
    method: 'POST',
    headers: { 'X-Kit-Api-Key': apiKey, 'Content-Type': 'application/json' },
    body: '{}',
  });
  if (!res.ok) {
    console.warn('[lead-capture] Kit apply tag failed', { status: res.status, tagId, body: await res.text().catch(() => '') });
  }
}

// ── Airtable helper ────────────────────────────────────────────────────────

async function upsertAirtableLead(
  token: string,
  baseId: string,
  table: string,
  fields: Record<string, string>,
): Promise<void> {
  if (!token || !baseId || !fields.Email) return;
  const res = await fetch(`https://api.airtable.com/v0/${baseId}/${encodeURIComponent(table)}`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      performUpsert: { fieldsToMergeOn: ['Email'] },
      records: [{ fields }],
    }),
  });
  if (!res.ok) {
    console.warn('[lead-capture] Airtable upsert failed', { status: res.status, body: await res.text().catch(() => '') });
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
  const contentType = request.headers.get('content-type') ?? '';
  const isJson = contentType.includes('application/json');

  // ── parse ─────────────────────────────────────────────────────────────
  let full_name = '';
  let email = '';
  let phone = '';
  let source = 'footwork-free';

  let honeypot = '';
  try {
    if (isJson) {
      const body = (await request.json()) as Record<string, string>;
      full_name = (body.full_name ?? '').trim();
      email     = (body.email    ?? '').trim();
      phone     = (body.phone    ?? '').trim();
      source    = (body.source   ?? source).trim();
      honeypot  = (body.website  ?? '').trim();
    } else {
      const data = await request.formData();
      full_name = ((data.get('full_name') as string) ?? '').trim();
      email     = ((data.get('email')     as string) ?? '').trim();
      phone     = ((data.get('phone')     as string) ?? '').trim();
      source    = ((data.get('source')    as string) ?? source).trim();
      honeypot  = ((data.get('website')   as string) ?? '').trim();
    }
  } catch {
    return isJson
      ? jsonResponse({ success: false, error: 'Malformed request body.' }, 400, headers)
      : redirectResponse('/foundation?error=bad_request');
  }

  // ── validate ──────────────────────────────────────────────────────────
  // Honeypot — bots fill hidden fields, humans don't. Silent 200 to avoid fingerprinting.
  if (honeypot) return jsonResponse({ success: true }, 200, headers);
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

  // ── Resend welcome email (fire-and-forget) ───────────────────────────
  const resendKey = e['RESEND_API_KEY'] ?? '';
  sendResendWelcome(resendKey, email, source).catch(() => {});

  // ── Kit — subscribe + tag (fire-and-forget, never blocks response) ────
  const kitKey   = e['KIT_API_KEY'] ?? '';
  const kitTagId = e['KIT_LEAD_TAG_ID'] ?? '';
  if (!kitKey) {
    console.warn('[lead-capture] KIT_API_KEY not set — subscriber will NOT be added to Kit', { source, emailLog });
  } else if (!kitTagId) {
    console.warn('[lead-capture] KIT_LEAD_TAG_ID not set — subscriber will be created in Kit but not tagged', { source, emailLog });
    kitFindOrCreate(kitKey, email, full_name).catch((err) =>
      console.warn('[lead-capture] Kit create failed', { emailLog, err: String(err) }),
    );
  } else {
    kitApplyTag(kitKey, email, full_name, kitTagId).catch((err) =>
      console.warn('[lead-capture] Kit tag failed', { emailLog, err: String(err) }),
    );
  }

  // ── Airtable — upsert lead record (fire-and-forget) ──────────────────
  const airtableToken = e['AIRTABLE_API_KEY'] ?? '';
  const airtableBase  = e['AIRTABLE_BASE_ID'] ?? '';
  const airtableTable = e['AIRTABLE_LEADS_TABLE'] ?? 'Leads';
  if (!airtableToken) {
    console.warn('[lead-capture] AIRTABLE_API_KEY not set — lead will NOT be saved to Airtable', { source, emailLog });
  } else if (!airtableBase) {
    console.warn('[lead-capture] AIRTABLE_BASE_ID not set — lead will NOT be saved to Airtable', { source, emailLog });
  } else {
    upsertAirtableLead(airtableToken, airtableBase, airtableTable, {
      Email:            email,
      Name:             full_name,
      Source:           source,
      Phone:            phone,
      'Date Submitted': new Date().toISOString(),
    }).catch((err) =>
      console.warn('[lead-capture] Airtable upsert failed', { emailLog, err: String(err) }),
    );
  }

  const successHeaders = { ...headers, 'X-Lead-Webhook-Status': webhookStatus };
  return isJson
    ? jsonResponse({ success: true, webhookStatus }, 200, successHeaders)
    : redirectResponse('/thank-you/footwork-blueprint');
}
