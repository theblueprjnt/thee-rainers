// Single source of truth for the next live Defense Workshop date.
// Update this file when scheduling the next session. The build will fail
// (in production builds) if the date here is in the past, preventing
// silent date rot on the live site.

export const WORKSHOP_DATE_ISO = '2026-06-27';
export const WORKSHOP_DATE_LONG = 'Saturday, June 27';
export const WORKSHOP_DATE_SHORT = 'June 27';
export const WORKSHOP_PRICE = 197;
export const WORKSHOP_DURATION = '90 Min';

// Fail the production build if the workshop date has passed and nobody
// updated it. import.meta.env.PROD is true during `astro build`, false in dev.
if (import.meta.env.PROD) {
  const target = new Date(WORKSHOP_DATE_ISO + 'T23:59:59Z').getTime();
  if (Date.now() > target) {
    throw new Error(
      `[date-freshness] Workshop date ${WORKSHOP_DATE_ISO} has passed. ` +
      `Update WORKSHOP_DATE_ISO in src/data/workshop.ts before deploying.`
    );
  }
}
