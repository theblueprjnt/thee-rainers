// Single source of truth for the Nov 29, 2026 Defense Workshop date and
// duration. Used by defense-workshop.astro, OfferStack.astro, and any other
// surface that needs to know whether the live event has happened yet.
//
// Nov 29, 2026 is after DST ends in the US (first Sunday in November), so
// ET here is EST, UTC-5. 12:00 PM EST = 17:00 UTC.
//
// Workshop length confirmed by Rainers: 60 min teaching + 30 min Q&A.

export const WORKSHOP_START_ISO = '2026-11-29T17:00:00Z';
export const WORKSHOP_DURATION_MINUTES = 90;

export const WORKSHOP_START_MS = new Date(WORKSHOP_START_ISO).getTime();
export const WORKSHOP_END_MS = WORKSHOP_START_MS + WORKSHOP_DURATION_MINUTES * 60 * 1000;

export const WORKSHOP_DATE_LABEL = 'Sunday, Nov 29, 12:00 PM ET';
