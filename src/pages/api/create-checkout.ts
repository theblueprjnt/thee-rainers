export const prerender = false;

import Stripe from 'stripe';
import { env as cfEnv } from 'cloudflare:workers';
import { GRADE3_SEATS_TAKEN, GRADE3_MAX_SEATS } from '../../data/grade3-seats.ts';

// ── Product catalog ───────────────────────────────────────────────────────
// Single source of truth for Stripe Checkout Sessions across the site.
// Buttons reference these by lookupKey via `data-checkout="footwork"` etc.
//
// IMPORTANT: optionalItems is the Stripe-native cross-sell that renders as
// "Add to your order" on the Checkout page. Each price ID must be a
// discounted one-time price created in Stripe Dashboard for that purpose.
// Stripe SDK installed here (stripe-node 22.1.1, default pinned API version
// 2026-04-22.dahlia -- see node_modules/stripe/cjs/apiVersion.js) is well
// past 2025-03-31.basil, when optional_items shipped. No SDK upgrade needed.

// Every country code Stripe Checkout's shipping_address_collection accepts
// (Checkout.Session.ShippingAddressCollection.AllowedCountry, stripe-node
// 22.1.1 type defs) -- Stripe has no "all countries" wildcard, this is the
// literal full allowlist.
const ALL_SHIPPING_COUNTRIES = [
  'AC', 'AD', 'AE', 'AF', 'AG', 'AI', 'AL', 'AM', 'AO', 'AQ', 'AR', 'AT', 'AU', 'AW', 'AX', 'AZ',
  'BA', 'BB', 'BD', 'BE', 'BF', 'BG', 'BH', 'BI', 'BJ', 'BL', 'BM', 'BN', 'BO', 'BQ', 'BR', 'BS',
  'BT', 'BV', 'BW', 'BY', 'BZ', 'CA', 'CD', 'CF', 'CG', 'CH', 'CI', 'CK', 'CL', 'CM', 'CN', 'CO',
  'CR', 'CV', 'CW', 'CY', 'CZ', 'DE', 'DJ', 'DK', 'DM', 'DO', 'DZ', 'EC', 'EE', 'EG', 'EH', 'ER',
  'ES', 'ET', 'FI', 'FJ', 'FK', 'FO', 'FR', 'GA', 'GB', 'GD', 'GE', 'GF', 'GG', 'GH', 'GI', 'GL',
  'GM', 'GN', 'GP', 'GQ', 'GR', 'GS', 'GT', 'GU', 'GW', 'GY', 'HK', 'HN', 'HR', 'HT', 'HU', 'ID',
  'IE', 'IL', 'IM', 'IN', 'IO', 'IQ', 'IS', 'IT', 'JE', 'JM', 'JO', 'JP', 'KE', 'KG', 'KH', 'KI',
  'KM', 'KN', 'KR', 'KW', 'KY', 'KZ', 'LA', 'LB', 'LC', 'LI', 'LK', 'LR', 'LS', 'LT', 'LU', 'LV',
  'LY', 'MA', 'MC', 'MD', 'ME', 'MF', 'MG', 'MK', 'ML', 'MM', 'MN', 'MO', 'MQ', 'MR', 'MS', 'MT',
  'MU', 'MV', 'MW', 'MX', 'MY', 'MZ', 'NA', 'NC', 'NE', 'NG', 'NI', 'NL', 'NO', 'NP', 'NR', 'NU',
  'NZ', 'OM', 'PA', 'PE', 'PF', 'PG', 'PH', 'PK', 'PL', 'PM', 'PN', 'PR', 'PS', 'PT', 'PY', 'QA',
  'RE', 'RO', 'RS', 'RU', 'RW', 'SA', 'SB', 'SC', 'SD', 'SE', 'SG', 'SH', 'SI', 'SJ', 'SK', 'SL',
  'SM', 'SN', 'SO', 'SR', 'SS', 'ST', 'SV', 'SX', 'SZ', 'TA', 'TC', 'TD', 'TF', 'TG', 'TH', 'TJ',
  'TK', 'TL', 'TM', 'TN', 'TO', 'TR', 'TT', 'TV', 'TW', 'TZ', 'UA', 'UG', 'US', 'UY', 'UZ', 'VA',
  'VC', 'VE', 'VG', 'VN', 'VU', 'WF', 'WS', 'XK', 'YE', 'YT', 'ZA', 'ZM', 'ZW', 'ZZ',
] as const;

// $29 Workshop Replay order bump, added as a Stripe optional_item on the
// three Blueprint checkouts (task 3). Verified read-only against live
// Stripe 2026-11-22: $29.00 USD, one_time, active.
const WORKSHOP_REPLAY_BUMP_PRICE_ID = 'price_1UdSi8HzlarU775HTvJw8zvu';
const BLUEPRINT_OPTIONAL_ITEMS = [{ price: WORKSHOP_REPLAY_BUMP_PRICE_ID }];

interface ProductConfig {
  priceId: string;
  mode: 'payment' | 'subscription';
  successPath: string;
  cancelPath: string;
  /** Stripe-native "Add to your order" cross-sell on the Checkout page. */
  optionalItems?: Array<{ price: string }>;
  /** Turns on Checkout's built-in shipping address step, all countries Stripe supports. */
  collectShipping?: boolean;
}

const PRODUCTS: Record<string, ProductConfig> = {
  footwork: {
    priceId: 'price_1U7ZfRHzlarU775H5rxIJ2VS',
    mode: 'payment',
    successPath: '/thank-you/footwork',
    cancelPath: '/foundation',
    optionalItems: BLUEPRINT_OPTIONAL_ITEMS,
  },
  shadowboxing: {
    priceId: 'price_2',
    mode: 'payment',
    successPath: '/thank-you/shadowboxing',
    cancelPath: '/shadowboxing-blueprint',
    optionalItems: BLUEPRINT_OPTIONAL_ITEMS,
  },
  bundle: {
    priceId: 'price_1U7ZizHzlarU775HDKLCmNza',
    mode: 'payment',
    successPath: '/thank-you/bundle',
    cancelPath: '/shop',
    optionalItems: BLUEPRINT_OPTIONAL_ITEMS,
  },

  // Workshop Replay, on-demand $49 purchase (task 2). Previously had no
  // lookupKey at all -- the page's buttons linked straight to
  // /defense-workshop instead of a working checkout.
  // Verified read-only against live Stripe 2026-11-22: $49.00 USD,
  // one_time, active.
  workshop_replay: {
    priceId: 'price_1UdSB9HzlarU775Hq80DQaKd',
    mode: 'payment',
    successPath: '/thank-you/workshop-replay',
    cancelPath: '/workshop-replay',
  },

  // Defense Workshop, Nov 29 2026, three ticket tiers (task 1).
  // "Live" keeps the pre-existing lookupKey/priceId on purpose -- the brief
  // names it "existing defense_workshop_standard price in create-checkout.ts".
  // defense_workshop_early ($39, price_6) removed per task 1 -- that
  // early-bird window closed 2026-08-08 and the product no longer exists in
  // this brief's price list.
  // Verified read-only against live Stripe 2026-11-22: $49.00 USD,
  // one_time, active. (Yes, "price_5" is a real ID -- this account allows
  // literal custom price IDs on its older products.)
  defense_workshop_standard: {
    priceId: 'price_5',
    mode: 'payment',
    successPath: '/thank-you/defense-workshop',
    cancelPath: '/defense-workshop',
  },
  // Verified read-only against live Stripe 2026-11-22: $99.00 USD,
  // one_time, active.
  defense_workshop_review: {
    priceId: 'price_1UdSbdHzlarU775HtG58zLEo',
    mode: 'payment',
    successPath: '/thank-you/defense-workshop?tier=review',
    cancelPath: '/defense-workshop',
  },
  // Verified read-only against live Stripe 2026-11-22: $199.00 USD,
  // one_time, active.
  defense_workshop_call: {
    priceId: 'price_1UdTDzHzlarU775HFyWrH6Vj',
    mode: 'payment',
    successPath: '/thank-you/defense-workshop?tier=call',
    cancelPath: '/defense-workshop',
  },

  grade1: {
    priceId: 'price_1U4q3eHzlarU775Hfstnii3t',
    mode: 'payment',
    successPath: '/thank-you/coaching',
    cancelPath: '/coaching',
  },
  grade2: {
    priceId: 'price_1U4qbjHzlarU775HijJLIBDl',
    mode: 'payment',
    successPath: '/thank-you/coaching',
    cancelPath: '/coaching',
    // Grade 2 ships a physical bonus (task 5) -- no other step in the
    // funnel collects an address, straight to this checkout from the
    // PricingCard button. Turning on Checkout's native shipping step.
    collectShipping: true,
  },
  grade3: {
    priceId: 'price_1U4qerHzlarU775HfPUhdhNb',
    mode: 'payment',
    successPath: '/thank-you/coaching',
    cancelPath: '/coaching',
  },

  // 3-payment plans (task 5). Subscription mode so Stripe handles the
  // recurring charge, but these are NOT open-ended memberships -- the
  // webhook (stripe-webhook.ts) tracks payments_made in the subscription's
  // metadata and calls subscriptions.cancel() right after the 3rd invoice
  // pays, so no 4th charge ever happens. Fulfillment (confirmation email,
  // Kit tag, Airtable, GA4, Telegram) fires once, on the first payment only
  // -- invoice.payment_succeeded renewals do not re-fulfill.
  // Verified read-only against live Stripe 2026-11-22: $365.00 USD/month,
  // recurring, active.
  grade2_plan: {
    priceId: 'price_1UdTFcHzlarU775HnwooM3gk',
    mode: 'subscription',
    successPath: '/thank-you/coaching',
    cancelPath: '/coaching',
    collectShipping: true,
  },
  // Counts toward the 5-seat Grade 3 cap, same as the one-time grade3
  // lookupKey -- see the GRADE3_SEATS_TAKEN check below.
  // Verified read-only against live Stripe 2026-11-22: $4,400.00 USD/month,
  // recurring, active.
  grade3_plan: {
    priceId: 'price_1UdTH7HzlarU775HTuLyiPhy',
    mode: 'subscription',
    successPath: '/thank-you/coaching',
    cancelPath: '/coaching',
  },

  // $79, replaces the old price_1UZbeWHzlarU775Hz6RkaVet (task 4).
  // Verified read-only against live Stripe 2026-11-22: $79.00 USD,
  // one_time, active.
  masterclass: {
    priceId: 'price_1UdTErHzlarU775HQrnlmVcX',
    mode: 'payment',
    successPath: '/thank-you/masterclass',
    cancelPath: '/masterclass',
  },

  // greatness_monthly / greatness_annual removed (task 6) -- The Weekly
  // Session / Greatness Community is retired, zero active subscribers,
  // /community already 301s to /coaching. Checkout for it can no longer be
  // triggered from this endpoint.
};

// Grade 3 is capped at 5 seats ($12,000, 12-month program, or the 3-payment
// plan at $4,400 x 3 -- both count toward the same cap). Checkout Sessions
// are created here in code, so a Stripe Payment Link's built-in payment
// limit doesn't apply -- this is the server-side equivalent. Owner
// increments this manually as seats sell; at 5 people and this price point
// he knows about every sale personally, so a manual count is reliable here.
// Constants now live in data/grade3-seats.ts -- coaching/grade-3.astro reads
// the same source to render "X of 5" instead of duplicating the number.
const GRADE3_LOOKUP_KEYS = new Set(['grade3', 'grade3_plan']);

export async function POST({ request }: { request: Request }): Promise<Response> {
  const e = cfEnv as unknown as Record<string, string>;
  const siteUrl = e['SITE_URL'] ?? 'https://theerainers.com';
  const headers = { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': siteUrl };

  try {
    const { lookupKey, customerEmail } = await request.json() as { lookupKey: string; customerEmail?: string };
    const product = PRODUCTS[lookupKey];
    if (!product) {
      return new Response(JSON.stringify({ error: 'unknown lookupKey' }), { status: 400, headers });
    }

    if (GRADE3_LOOKUP_KEYS.has(lookupKey) && GRADE3_SEATS_TAKEN >= GRADE3_MAX_SEATS) {
      return new Response(JSON.stringify({ error: 'Grade 3 is full. Email rainers@theerainers.com to ask about the next opening.' }), { status: 400, headers });
    }

    const stripe = new Stripe(e['STRIPE_SECRET_KEY'] ?? '', { httpClient: Stripe.createFetchHttpClient() });

    // successPath may already carry a query string (e.g. "?tier=review") --
    // append session_id with "&" in that case instead of a second "?".
    const successSeparator = product.successPath.includes('?') ? '&' : '?';

    const sessionParams: Stripe.Checkout.SessionCreateParams = {
      mode: product.mode,
      line_items: [{ price: product.priceId, quantity: 1 }],
      allow_promotion_codes: true,
      ...(customerEmail ? { customer_email: customerEmail } : {}),
      success_url: `${siteUrl}${product.successPath}${successSeparator}session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${siteUrl}${product.cancelPath}`,
      metadata: { lookup_key: lookupKey },
      ...(product.optionalItems ? { optional_items: product.optionalItems } : {}),
      ...(product.collectShipping
        ? { shipping_address_collection: { allowed_countries: [...ALL_SHIPPING_COUNTRIES] } }
        : {}),
    };

    if (product.mode === 'subscription') {
      sessionParams.subscription_data = { metadata: { lookup_key: lookupKey } };
    } else {
      sessionParams.payment_intent_data = { metadata: { lookup_key: lookupKey } };
    }

    const session = await stripe.checkout.sessions.create(sessionParams);

    return new Response(JSON.stringify({ url: session.url }), { headers });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('[create-checkout] error:', msg);
    return new Response(JSON.stringify({ error: msg }), { status: 500, headers });
  }
}

export async function OPTIONS(): Promise<Response> {
  const e = cfEnv as unknown as Record<string, string>;
  return new Response(null, {
    headers: {
      'Access-Control-Allow-Origin': e['SITE_URL'] ?? 'https://theerainers.com',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}
