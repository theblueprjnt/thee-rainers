// Single source of truth for product name/price/id facts. Everything here
// was verified against live Stripe (`stripe get ... --live`) and the repo
// on 2026-08-18 — see the audit that preceded this file. Grade 1/2/3
// deliberately excluded: navigation and the Grade pages are a separate
// decision, not touched by this file or its consumers.
//
// Import from here instead of hardcoding a price or Stripe id. If a price
// changes, it changes in exactly one place.

export type ProductStatus =
  | { state: 'live' }
  | { state: 'retired'; redirectTo?: string };

export interface Product {
  key: string;
  displayName: string;
  priceCents: number;
  currency: string;
  stripePriceId: string;
  pagePath: string;
  kitTagId: string;
  status: ProductStatus;
  /** Only set when something about this product's real-world wiring
   * contradicts what its own definition implies -- documented here so it
   * isn't silently lost, not something this file tries to fix. */
  note?: string;
}

export const PRODUCTS: Record<string, Product> = {
  footwork: {
    key: 'footwork',
    displayName: 'The Footwork Blueprint',
    priceCents: 1900,
    currency: 'USD',
    stripePriceId: 'price_1U7ZfRHzlarU775H5rxIJ2VS',
    pagePath: '/foundation',
    kitTagId: '19807643', // FIXME: tag 19807643 does not exist in Kit — create it
    status: { state: 'live' },
    note: 'Named "The Footwork Blueprint" on the site, "The Footwork Foundation" in Stripe\'s own product catalog (prod_UZ9lTK2PhsS4xs) — same product, disagreeing names in two places.',
  },
  shadowboxing: {
    key: 'shadowboxing',
    displayName: 'The Shadowboxing Blueprint',
    priceCents: 1900,
    currency: 'USD',
    stripePriceId: 'price_2',
    pagePath: '/shadowboxing-blueprint',
    kitTagId: '19807641',
    status: { state: 'live' },
  },
  bundle: {
    key: 'bundle',
    displayName: 'Footwork + Shadowboxing Bundle',
    priceCents: 3000,
    currency: 'USD',
    stripePriceId: 'price_1U7ZizHzlarU775HDKLCmNza',
    pagePath: '/shop',
    kitTagId: '19807644',
    status: { state: 'live' },
  },
  'defense-workshop': {
    key: 'defense-workshop',
    displayName: 'Defense Workshop',
    priceCents: 4900,
    currency: 'USD',
    stripePriceId: 'price_5',
    pagePath: '/defense-workshop',
    kitTagId: '19807641', // shares shadowboxing's tag until a dedicated one exists
    status: { state: 'live' },
    note: 'Live Sunday, Nov 29, 2026, 12:00 PM ET (see src/data/defense-workshop.ts). This entry represents the $49 "Live" tier only (create-checkout.ts lookupKey defense_workshop_standard, unchanged price_5). Two upsell tiers exist only in create-checkout.ts, not duplicated here: Live + footage review ($99, defense_workshop_review) and Live + 1:1 call ($199, defense_workshop_call). The old $39 early-bird (defense_workshop_early, price_6) was removed 2026-11-19 -- its window had already closed and it is not in the current price list.',
  },
  'workshop-replay': {
    key: 'workshop-replay',
    displayName: 'Workshop Replay',
    priceCents: 4900,
    currency: 'USD',
    stripePriceId: 'price_1UdSB9HzlarU775Hq80DQaKd',
    pagePath: '/workshop-replay',
    kitTagId: '',
    status: { state: 'live' },
    note: 'Fixed 2026-11-19: create-checkout.ts now has a workshop_replay lookupKey, and the three former "Reserve Seat" buttons on workshop-replay.astro now point to it instead of /defense-workshop. Price ID above changed from the old price_1U5P9XHzlarU775HZfK91WPb to price_1UdSB9HzlarU775Hq80DQaKd. Verified read-only against live Stripe 2026-11-22: $49.00 USD, one_time, active.',
  },
  masterclass: {
    key: 'masterclass',
    displayName: 'Masterclass',
    priceCents: 7900,
    currency: 'USD',
    stripePriceId: 'price_1UdTErHzlarU775HQrnlmVcX',
    pagePath: '/masterclass',
    kitTagId: '',
    status: { state: 'live' },
    note: 'Added 2026-11-19, price changed from $57 (price_1UZbeWHzlarU775Hz6RkaVet) to $79 (price_1UdTErHzlarU775HQrnlmVcX) per this brief. Verified read-only against live Stripe 2026-11-22: $79.00 USD, one_time, active. "Masterclass" is the one name used sitewide -- older internal notes called this a mastermind, that wording is gone now.',
  },
  greatness: {
    key: 'greatness',
    displayName: 'The Weekly Session',
    priceCents: 3900,
    currency: 'USD',
    stripePriceId: 'price_1Tbn8WHzlarU775HMfmbxaJy', // monthly; price_1Tbn93HzlarU775HrkAJ73Yf is the $390/yr annual variant
    pagePath: '/community',
    kitTagId: '19830354',
    status: { state: 'retired', redirectTo: '/coaching' },
    note: 'Zero active subscribers at retirement. Site-side retired (public/_redirects sends /community to /coaching). As of 2026-11-19 checkout can no longer be triggered at all -- greatness_monthly / greatness_annual were removed from create-checkout.ts\'s PRODUCTS map entirely (task 6). Stripe products/prices themselves were never archived -- archiving is the owner\'s Stripe Dashboard task, not done here.',
  },
};
