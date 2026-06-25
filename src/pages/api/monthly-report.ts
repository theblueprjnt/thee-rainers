export const prerender = false;

// GET /api/monthly-report
// Called by GitHub Actions cron on the 1st of every month.
// Requires Authorization: Bearer CRON_SECRET header.
// Env vars: CRON_SECRET, STRIPE_SECRET_KEY, RESEND_API_KEY

import type { APIContext } from 'astro';
import Stripe from 'stripe';
import { env as cfEnv } from 'cloudflare:workers';

const PRODUCT_NAMES: Record<string, string> = {
  'prod_UZOMBOeJ0mm15I': 'Workshop Replay ($47)',
  'prod_UZrejf6iuDorEA': 'Footwork Blueprint ($47)',
  'prod_UZreDlek9325EY': 'Shadowboxing Blueprint ($47)',
  'prod_UZreHroYQEDAFU': 'Bundle ($87)',
  'prod_UZ9lTK2PhsS4xs': 'Membership — Footwork ($47/mo)',
  'prod_UZ9vV79TAun9yB': 'Membership — Shadowboxing ($47/mo)',
  'prod_UZ9xqJt3glrCOO': 'Membership — Bundle ($47/mo)',
  'prod_Uaz6EzELZP6j0V': 'Greatness Community',
};

function formatMoney(cents: number): string {
  return `$${(cents / 100).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

function lastMonthRange(): { start: number; end: number; label: string } {
  const now = new Date();
  const year = now.getUTCMonth() === 0 ? now.getUTCFullYear() - 1 : now.getUTCFullYear();
  const month = now.getUTCMonth() === 0 ? 11 : now.getUTCMonth() - 1;
  const start = Math.floor(new Date(Date.UTC(year, month, 1)).getTime() / 1000);
  const end   = Math.floor(new Date(Date.UTC(year, month + 1, 1)).getTime() / 1000) - 1;
  const label = new Date(Date.UTC(year, month, 1)).toLocaleString('en-US', { month: 'long', year: 'numeric', timeZone: 'UTC' });
  return { start, end, label };
}

export async function GET({ request }: APIContext): Promise<Response> {
  const e = cfEnv as unknown as Record<string, string>;

  // ── auth ──────────────────────────────────────────────────────────────
  const cronSecret  = e['CRON_SECRET'] ?? '';
  const authHeader  = request.headers.get('Authorization') ?? '';
  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return new Response('Unauthorized', { status: 401 });
  }

  const stripeKey  = e['STRIPE_SECRET_KEY'] ?? '';
  const resendKey  = e['RESEND_API_KEY'] ?? '';
  if (!stripeKey || !resendKey) {
    return new Response('Missing env vars', { status: 500 });
  }

  const stripe = new Stripe(stripeKey, {
    apiVersion: '2025-04-30.basil',
    httpClient: Stripe.createFetchHttpClient(),
  });

  const { start, end, label } = lastMonthRange();

  // ── pull Stripe events ────────────────────────────────────────────────
  const salesByProduct: Record<string, { count: number; revenue: number }> = {};
  let totalRevenue = 0;
  let totalSales   = 0;

  let hasMore = true;
  let startingAfter: string | undefined;

  while (hasMore) {
    const events = await stripe.events.list({
      type: 'checkout.session.completed',
      created: { gte: start, lte: end },
      limit: 100,
      ...(startingAfter ? { starting_after: startingAfter } : {}),
    });

    for (const ev of events.data) {
      const session = ev.data.object as Stripe.Checkout.Session;
      if (session.payment_status !== 'paid') continue;
      const amountCents = session.amount_total ?? 0;
      totalRevenue += amountCents;
      totalSales   += 1;

      // Try to get product from metadata stored on session
      let productKey = 'Unknown';
      try {
        const items = await stripe.checkout.sessions.listLineItems(session.id, {
          expand: ['data.price.product'],
          limit: 1,
        });
        const prod = items.data[0]?.price?.product;
        if (prod && typeof prod === 'object' && 'id' in prod) {
          const pid = (prod as Stripe.Product).id;
          productKey = PRODUCT_NAMES[pid] ?? pid;
        }
      } catch { /* skip — use Unknown */ }

      if (!salesByProduct[productKey]) salesByProduct[productKey] = { count: 0, revenue: 0 };
      salesByProduct[productKey].count   += 1;
      salesByProduct[productKey].revenue += amountCents;
    }

    hasMore = events.has_more;
    if (hasMore && events.data.length > 0) {
      startingAfter = events.data[events.data.length - 1].id;
    } else {
      hasMore = false;
    }
  }

  // ── build email ───────────────────────────────────────────────────────
  const rows = Object.entries(salesByProduct)
    .sort((a, b) => b[1].revenue - a[1].revenue)
    .map(([product, { count, revenue }]) =>
      `<tr>
        <td style="padding:10px 0;border-bottom:1px solid #eee;font-size:13px;color:#0A0A0A;">${product}</td>
        <td style="padding:10px 0;border-bottom:1px solid #eee;font-size:13px;text-align:center;color:#555;">${count}</td>
        <td style="padding:10px 0;border-bottom:1px solid #eee;font-size:13px;text-align:right;font-weight:700;color:#0A0A0A;">${formatMoney(revenue)}</td>
      </tr>`,
    )
    .join('');

  const html =
    `<div style="font-family:monospace;max-width:600px;margin:0 auto;padding:32px 24px;color:#0A0A0A;">` +
    `<p style="font-size:11px;letter-spacing:0.12em;text-transform:uppercase;color:#888;margin:0 0 8px;">Thee Rainers</p>` +
    `<p style="font-size:22px;font-weight:700;margin:0 0 32px;">${label} — Monthly Report</p>` +

    `<table style="width:100%;border-collapse:collapse;margin:0 0 32px;">` +
    `<tr>` +
    `<td style="padding:16px 24px;background:#0A0A0A;color:#fff;font-size:11px;letter-spacing:0.1em;text-transform:uppercase;">Revenue</td>` +
    `<td style="padding:16px 24px;background:#0A0A0A;color:#fff;font-size:22px;font-weight:700;text-align:right;">${formatMoney(totalRevenue)}</td>` +
    `</tr>` +
    `<tr>` +
    `<td style="padding:12px 24px;background:#F6F6F6;font-size:11px;letter-spacing:0.1em;text-transform:uppercase;color:#888;">Sales</td>` +
    `<td style="padding:12px 24px;background:#F6F6F6;font-size:16px;font-weight:700;text-align:right;">${totalSales}</td>` +
    `</tr>` +
    `</table>` +

    (rows
      ? `<p style="font-size:11px;letter-spacing:0.1em;text-transform:uppercase;color:#888;margin:0 0 8px;">By Product</p>` +
        `<table style="width:100%;border-collapse:collapse;margin:0 0 32px;">` +
        `<tr>` +
        `<th style="padding:8px 0;border-bottom:2px solid #0A0A0A;font-size:10px;letter-spacing:0.1em;text-transform:uppercase;text-align:left;color:#888;">Product</th>` +
        `<th style="padding:8px 0;border-bottom:2px solid #0A0A0A;font-size:10px;letter-spacing:0.1em;text-transform:uppercase;text-align:center;color:#888;">Sales</th>` +
        `<th style="padding:8px 0;border-bottom:2px solid #0A0A0A;font-size:10px;letter-spacing:0.1em;text-transform:uppercase;text-align:right;color:#888;">Revenue</th>` +
        `</tr>` +
        rows +
        `</table>`
      : `<p style="color:#888;font-size:14px;">No sales recorded for this period.</p>`
    ) +

    `<p style="font-size:11px;color:#aaa;margin:0;">Generated ${new Date().toUTCString()}</p>` +
    `</div>`;

  const emailRes = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${resendKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from: 'Thee Rainers <rainers@theerainers.com>',
      to: ['rainers@theerainers.com'],
      subject: `${label} — ${formatMoney(totalRevenue)} · ${totalSales} sale${totalSales !== 1 ? 's' : ''}`,
      html,
    }),
  });

  if (!emailRes.ok) {
    console.error('[monthly-report] Resend failed', emailRes.status, await emailRes.text());
    return new Response('Email send failed', { status: 500 });
  }

  console.log('[monthly-report] Sent for', label, { totalRevenue, totalSales });
  return new Response(JSON.stringify({ ok: true, label, totalRevenue, totalSales }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
}
