// Update this weekly. Rebuild + push deploys the new date everywhere it shows.
// PROVING_GROUND_ISO drives the build-time freshness check.
export const PROVING_GROUND_ISO = '2026-07-11';
export const NEXT_PROVING_GROUND = {
  date: 'Saturday, July 11',
  time: '10am ET',
};

// Used as soft anchor ("100+ on the path") — not framed as "live inside" to
// avoid promising interactive presence we haven't fully built yet.
export const COMMUNITY_MEMBER_COUNT = 120;

// Fail the production build if the Proving Ground date has passed.
if (import.meta.env.PROD) {
  const target = new Date(PROVING_GROUND_ISO + 'T23:59:59Z').getTime();
  if (Date.now() > target) {
    throw new Error(
      `[date-freshness] Proving Ground date ${PROVING_GROUND_ISO} has passed. ` +
      `Update PROVING_GROUND_ISO + NEXT_PROVING_GROUND in src/data/proving-ground.ts before deploying.`
    );
  }
}
