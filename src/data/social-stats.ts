// Social follower counts (thousands). Single source of truth — every page
// consumes from here. Update this file when counts change; the site rebuilds
// on push.
//
// Update format: just edit the integer (in thousands). Decimals round down.
//   95.4K on TikTok → 95
//   18.3K on YouTube → 18
//   25.9K on Threads → 26

export const SOCIAL_STATS = {
  instagram: 332,
  facebook: 135,
  tiktok: 95,
  threads: 26,
  youtube: 18,
} as const;

export const LAST_UPDATED = '2026-05-30';
