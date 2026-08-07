// Defense Workshop config. Flip TICKETS_OPEN = true when ready to sell.
// Set NEXT_DATE_ISO = null (or omit) to enter "between" state with no date shown.
// Nothing here may ever throw or fail a build.

export const NEXT_DATE_ISO: string | null = '2026-08-29';
export const TICKETS_OPEN = false;

export const WORKSHOP_DATE_LONG  = 'Saturday, August 29';
export const WORKSHOP_DATE_SHORT = 'August 29';
export const WORKSHOP_TIME       = '12:00 PM ET';
export const WORKSHOP_DURATION   = '90 Min';
export const WORKSHOP_PAYMENT_LINK = 'https://buy.stripe.com/7sY28r8lt1D06XU6446J20n';

// Quote from a past attendee — used in STATE A hero. Leave empty to use fallback.
export const WORKSHOP_QUOTE      = '"The structure that was missing from my entire training."';
export const WORKSHOP_QUOTE_ATTR = 'Giancarlo';

// YouTube ID for a short Rainers intro clip. Leave empty to hide the video slot.
export const WORKSHOP_VIDEO_ID = '';

export type WorkshopState = 'selling' | 'waitlist' | 'between';

export function workshopState(): WorkshopState {
  if (!NEXT_DATE_ISO) return 'between';
  const sessionEnd = new Date(NEXT_DATE_ISO + 'T23:59:59').getTime();
  if (Date.now() > sessionEnd) return 'between';
  // Date is in the future — check tickets
  return TICKETS_OPEN ? 'selling' : 'waitlist';
}

export function nextDateDisplay(): string | null {
  const state = workshopState();
  if (state === 'between') return null;
  return WORKSHOP_DATE_LONG;
}
