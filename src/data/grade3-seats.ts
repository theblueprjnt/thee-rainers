// Single source of truth for the Grade 3 seat cap. Manual constant, not a
// live count, update by hand when a seat sells. Read by create-checkout.ts
// (to gate the checkout) and coaching/grade-3.astro (to render "X of 5").
export const GRADE3_SEATS_TAKEN = 0;
export const GRADE3_MAX_SEATS = 5;
