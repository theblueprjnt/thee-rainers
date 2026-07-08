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

// ── J2: Nav CTA is red and routes to /foundation ───────────────────────────
test('J2 nav CTA is red fill and routes to /foundation', async ({ page }) => {
  await page.goto(smokeUrl('/'));

  const cta = page.locator('a[href="/foundation"]').first();
  await expect(cta).toBeVisible();

  const bg = await cta.evaluate(el =>
    window.getComputedStyle(el).backgroundColor
  );
  // #E11D2A = rgb(225, 29, 42)
  expect(bg).toBe('rgb(225, 29, 42)');

  await page.screenshot({ path: `tests/smoke/artifacts/j2-nav-cta-${SMOKE_TS}.png` });
});

// ── J3: Opt-in end-to-end (foundation form) ────────────────────────────────
test('J3 opt-in: foundation form submits and redirects to thank-you', async ({ page }) => {
  await page.goto(smokeUrl('/foundation'));
  await expect(page.locator('#capture-email')).toBeVisible();

  await page.fill('#capture-name', 'Smoke Test');
  await page.fill('#capture-email', SMOKE_EMAIL);

  const [response] = await Promise.all([
    page.waitForResponse(r => r.url().includes('/api/lead-capture'), { timeout: 10_000 }),
    page.locator('#capture-submit').click(),
  ]);
  expect(response.status()).toBe(200);

  // Client-side redirect fires 400ms after fetch — trailing slash normalised by CF
  await page.waitForURL(/thank-you\/footwork-blueprint/, { timeout: 8000 });
  await expect(page.locator('h1').first()).toBeVisible();

  writeFileSync('tests/smoke/artifacts/j3-smoke-email.txt', SMOKE_EMAIL);
  await page.screenshot({ path: `tests/smoke/artifacts/j3-optin-${SMOKE_TS}.png` });
});

// ── J4: Popup fires on scroll and suppresses after submit ──────────────────
test('J4 popup fires on deep scroll and suppresses on reload', async ({ page }) => {
  await page.goto(smokeUrl('/'));
  await page.evaluate(() => localStorage.removeItem('tr_popup_v2'));
  await page.reload();

  // Scroll past 65% threshold
  await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
  await page.waitForTimeout(400);

  const popup = page.locator('#tr-popup');
  await expect(popup).not.toHaveClass(/hidden/, { timeout: 6000 });
  await page.screenshot({ path: `tests/smoke/artifacts/j4-popup-visible-${SMOKE_TS}.png` });

  // Popup requires BOTH name and email (if (!email || !name) return)
  const popupEmail = `smoke+${SMOKE_TS}p@theerainers.com`;
  await page.fill('#tr-popup-name', 'Smoke Test');
  await page.fill('#tr-popup-email', popupEmail);

  const [popupRes] = await Promise.all([
    page.waitForResponse(r => r.url().includes('/api/lead-capture'), { timeout: 10_000 }),
    page.locator('#tr-popup-submit').click(),
  ]);
  expect(popupRes.status()).toBe(200);
  await expect(page.locator('#tr-popup-success')).toBeVisible({ timeout: 3000 });
  // Popup code calls dismiss() after 3.2 s via setTimeout — wait for that so
  // localStorage is set before we reload, otherwise suppression check is vacuous
  await expect(page.locator('#tr-popup')).toHaveClass(/hidden/, { timeout: 5000 });

  // Suppression: reload, scroll — popup must stay hidden
  await page.reload();
  await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
  await page.waitForTimeout(500);
  await expect(page.locator('#tr-popup')).toHaveClass(/hidden/);

  await page.screenshot({ path: `tests/smoke/artifacts/j4-popup-suppressed-${SMOKE_TS}.png` });
});

// ── J5: Buy buttons link to correct Stripe URLs (no charges) ───────────────
test('J5 paid path: shop Stripe links present; Workshop Replay link present on its page', async ({ page }) => {
  // Shop page — three direct Stripe links
  await page.goto(smokeUrl('/shop'));
  await expect(page.locator('a[href="https://buy.stripe.com/5kQdR91X5dlIeqm8cc6J20l"]').first(),
    'Shadowboxing Blueprint Stripe link').toBeVisible();
  await expect(page.locator('a[href="https://buy.stripe.com/14A4gz59hgxUaa65006J20m"]').first(),
    'Bundle Stripe link').toBeVisible();
  await expect(page.locator('a[href="https://buy.stripe.com/7sY28r8lt1D06XU6446J20n"]').first(),
    'Defense Workshop Stripe link').toBeVisible();
  await page.screenshot({ path: `tests/smoke/artifacts/j5-shop-${SMOKE_TS}.png` });

  // Workshop Replay sales page — its own buy link
  await page.goto(smokeUrl('/workshop-replay'));
  const replayLink = page.locator('a[href="https://buy.stripe.com/6oUaEX7hp6Xk3LIdww6J20p"]').first();
  await expect(replayLink, 'Workshop Replay Stripe link on /workshop-replay').toBeVisible();
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
