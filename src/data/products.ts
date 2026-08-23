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
    note: 'Standard-rate price (price_5, $49). An early-bird price (price_6, $39) also exists in create-checkout.ts, active only while defense-workshop.astro\'s own EARLY_BIRD_UNTIL date is in the future — that window already closed 2026-08-08. This file represents the current live price only, not the date-conditional discount.',
  },
  'workshop-replay': {
    key: 'workshop-replay',
    displayName: 'Workshop Replay',
    priceCents: 4900,
    currency: 'USD',
    stripePriceId: 'price_1U5P9XHzlarU775HZfK91WPb',
    pagePath: '/workshop-replay',
    kitTagId: '',
    status: { state: 'live' },
    note: 'No working checkout: create-checkout.ts has no "workshop_replay" entry in PRODUCTS, and all three "Reserve Seat" buttons on workshop-replay.astro link to /defense-workshop instead of any checkout. stripe-webhook.ts has full delivery logic for this slug (watch-link email, GA4, Kit sequence) but nothing currently drives a purchase into it via the site\'s own checkout flow. Price above is this product\'s Stripe price, not proof it\'s purchasable from the page.',
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
    note: 'Zero active subscribers at retirement. Site-side retired (public/_redirects sends /community to /coaching), Stripe products/prices themselves were never archived — archiving is the owner\'s Stripe Dashboard task, not done here.',
  },
};
