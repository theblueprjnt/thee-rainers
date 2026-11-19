// Single source of truth for the Nov 29, 2026 Defense Workshop date and
// duration. Used by defense-workshop.astro, OfferStack.astro, and any other
// surface that needs to know whether the live event has happened yet.
//
// Nov 29, 2026 is after DST ends in the US (first Sunday in November), so
// ET here is EST, UTC-5. 12:00 PM EST = 17:00 UTC.
//
// Workshop length is not documented anywhere else in the codebase -- the old
// hero copy said "90 min" with no authoritative end time. Assuming 2 hours
// per instruction when this length wasn't findable in code. Confirm with
// Rainers and adjust WORKSHOP_DURATION_MINUTES if the real length differs.

export const WORKSHOP_START_ISO = '2026-11-29T17:00:00Z';
export const WORKSHOP_DURATION_MINUTES = 120;

export const WORKSHOP_START_MS = new Date(WORKSHOP_START_ISO).getTime();
export const WORKSHOP_END_MS = WORKSHOP_START_MS + WORKSHOP_DURATION_MINUTES * 60 * 1000;

export const WORKSHOP_DATE_LABEL = 'Sunday, Nov 29, 12:00 PM ET';
