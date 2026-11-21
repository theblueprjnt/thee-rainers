import { test, expect } from '@playwright/test';
import { writeFileSync } from 'fs';

const SMOKE_TS = Date.now();
const SMOKE_EMAIL = `smoke+${SMOKE_TS}@theerainers.com`;

function smokeUrl(path: string) {
  return `${path}${path.includes('?') ? '&' : '?'}smoke=1`;
}

// ── J1: Home renders non-blank ──────────────────────────────────────────────
test('J1 home renders non-blank with hero and nav', async ({ page }) => {
  const consoleErrors: string[] = [];
  page.on('console', m => {
    if (m.type() === 'error' && !m.text().includes('favicon')) {
      consoleErrors.push(m.text());
    }
  });

  await page.goto(smokeUrl('/'));
  await expect(page.locator('h1').first()).toBeVisible();
  // Desktop nav has `hidden md:flex` — attached on all viewports but visually hidden on mobile
  await expect(page.locator('nav').first()).toBeAttached();

  const h1Text = await page.locator('h1').first().textContent();
  expect((h1Text ?? '').trim().length).toBeGreaterThan(5);

  await page.screenshot({ path: `tests/smoke/artifacts/j1-home-${SMOKE_TS}.png` });
  expect(consoleErrors).toHaveLength(0);
});

// ── J2: Nav CTA is blue and routes to /foundation ──────────────────────────
// Color law changed red (#E11D2A) -> blue (#2348C6) 2026-08-23. /foundation
// itself moved from a free opt-in to a $19 paid product around the same
// time; the CTA still points there, now selling the Blueprint directly.
test('J2 nav CTA is blue fill and routes to /foundation', async ({ page }) => {
  await page.goto(smokeUrl('/'));

  const cta = page.locator('a[href="/foundation"]').first();
  await expect(cta).toBeVisible();

  const bg = await cta.evaluate(el =>
    window.getComputedStyle(el).backgroundColor
  );
  // #2348C6 = rgb(35, 72, 198)
  expect(bg).toBe('rgb(35, 72, 198)');

  await page.screenshot({ path: `tests/smoke/artifacts/j2-nav-cta-${SMOKE_TS}.png` });
});

// ── J3: Opt-in end-to-end (first-training form) ────────────────────────────
// /foundation no longer has an opt-in form -- it's a paid product page now.
// The free opt-in path lives on /first-training (email only, no name field,
// inline success state instead of a thank-you redirect).
test('J3 opt-in: first-training form submits and shows success', async ({ page }) => {
  await page.goto(smokeUrl('/first-training'));
  await expect(page.locator('#ft-email')).toBeVisible();

  await page.fill('#ft-email', SMOKE_EMAIL);

  const [response] = await Promise.all([
    page.waitForResponse(r => r.url().includes('/api/lead-capture'), { timeout: 10_000 }),
    page.locator('#ft-submit').click(),
  ]);
  expect(response.status()).toBe(200);

  await expect(page.locator('#ft-success')).toBeVisible({ timeout: 8000 });

  writeFileSync('tests/smoke/artifacts/j3-smoke-email.txt', SMOKE_EMAIL);
  await page.screenshot({ path: `tests/smoke/artifacts/j3-optin-${SMOKE_TS}.png` });
});

// ── J4: Popup stays off (deliberately disabled) ────────────────────────────
// ENTRY_PAGES = [] in Base.astro disables the auto-trigger on purpose
// (markup/logic kept intact to re-enable later). This guards that
// invariant: the popup must never self-show on scroll while disabled.
test('J4 popup markup present but does not self-trigger on deep scroll', async ({ page }) => {
  await page.goto(smokeUrl('/'));
  await page.evaluate(() => localStorage.removeItem('tr_popup_v2'));
  await page.reload();

  await expect(page.locator('#tr-popup')).toBeAttached();

  // Scroll past the old 65% threshold
  await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
  await page.waitForTimeout(400);

  await expect(page.locator('#tr-popup')).toHaveClass(/hidden/);
  await page.screenshot({ path: `tests/smoke/artifacts/j4-popup-stays-hidden-${SMOKE_TS}.png` });
});

// ── J5: Buy buttons present (Checkout Session pattern, no charges) ─────────
test('J5 paid path: shop checkout buttons present; Workshop Replay link present on its page', async ({ page }) => {
  // Shop sells Footwork, Shadowboxing, and the Bundle, all via the
  // site-wide data-checkout -> /api/create-checkout flow, not raw
  // buy.stripe.com Payment Links. Defense Workshop is not listed on /shop.
  await page.goto(smokeUrl('/shop'));
  await expect(page.locator('button[data-checkout="footwork"]').first(),
    'Footwork Blueprint checkout button').toBeVisible();
  await expect(page.locator('button[data-checkout="shadowboxing"]').first(),
    'Shadowboxing Blueprint checkout button').toBeVisible();
  await expect(page.locator('button[data-checkout="bundle"]').first(),
    'Bundle checkout button').toBeVisible();
  await page.screenshot({ path: `tests/smoke/artifacts/j5-shop-${SMOKE_TS}.png` });

  // Workshop Replay sales page — data-checkout button wired to USD Checkout Session
  await page.goto(smokeUrl('/workshop-replay'));
  const replayBtn = page.locator('button[data-checkout="workshop_replay"]').first();
  await expect(replayBtn, 'Workshop Replay buy button on /workshop-replay').toBeVisible();
  await page.screenshot({ path: `tests/smoke/artifacts/j5-workshop-replay-${SMOKE_TS}.png` });
});

// ── J6: HMAC gate rejects invalid token (redirects to sales page) ──────────
test('J6 HMAC gate rejects invalid token and redirects to sales page', async ({ page }) => {
  // Expiry far in the future so we test sig mismatch, not expiry
  await page.goto('/watch/workshop-replay?sig=deadbeef&exp=9999999999');

  // Gate must redirect — URL must NOT be /watch/
  await expect(page).toHaveURL(/^https:\/\/theerainers\.com\/workshop-replay(?:\/.*)?$/);
  await expect(page.locator('h1').first()).toBeVisible();

  await page.screenshot({ path: `tests/smoke/artifacts/j6-gate-reject-${SMOKE_TS}.png` });
  // UNVERIFIED: valid token + R2 presign URL — requires WATCH_TOKEN_SECRET + purchase record.
  // Logged in context.md as next harness task.
});

// ── J7: Crawl — key routes return 200 ─────────────────────────────────────
test('J7 crawl: key routes return 200', async ({ page }) => {
  const routes = [
    '/', '/foundation', '/shop', '/workshop', '/workshop-replay',
    '/community', '/command', '/links', '/about',
    '/legal/privacy-policy', '/legal/terms', '/legal/refund-policy',
    '/thank-you/contact',
  ];
  const results: Array<{ path: string; status: number }> = [];

  for (const path of routes) {
    const res = await page.request.get(`https://theerainers.com${path}`);
    results.push({ path, status: res.status() });
  }

  const failed = results.filter(r => r.status >= 400);
  writeFileSync(
    `tests/smoke/artifacts/j7-crawl-${SMOKE_TS}.json`,
    JSON.stringify(results, null, 2)
  );
  if (failed.length > 0) console.error('Failed routes:', failed);
  expect(failed).toHaveLength(0);
});
