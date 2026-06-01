// src/data/testimonials.ts
// Single source of truth for social proof / testimonials.
// (Mirrors the social-stats.ts pattern: one file, imported everywhere.)
//
// HARD RULE: every entry must be REAL. Do not invent quotes, names, results,
// or photos. An anonymous or invented testimonial is worse than none — 2026
// buyers are highly sensitive to fakes, and a fake that gets noticed burns
// trust on the whole page. Collect real ones, then add them here.
//
// What converts (verified 2026 CRO data): result-specific quotes (a concrete,
// ideally measurable change) with a real name and a face (video > photo > text).
// Praise-only quotes ("great product, loved it") barely move the needle.

export interface Testimonial {
  id: string;
  name: string;            // real first name (+ last initial if given)
  context: string;         // role + duration, e.g. "Private Architecture · 5 Months"
  quote: string;           // their words, short. Concrete change > praise.
  youtubeId?: string;      // video testimonial (highest trust). Paste the real ID.
  aspect?: 'landscape' | 'portrait';  // 'portrait' for YouTube Shorts (9:16). Default landscape.
  photo?: string;          // /images/... real headshot for written testimonials
  duration?: string;       // label on the video facade, e.g. "2 min"
  featured?: boolean;      // ONE spotlight per section. Do not feature more than one.
}

export const testimonials: Testimonial[] = [
  {
    id: "giancarlo-private-architecture",
    name: "Giancarlo",
    context: "Private Architecture · 5 Months",
    quote:
      "My footwork makes sense. I could see openings instead of just swinging.",
    youtubeId: "VCj0Dgfoako",
    aspect: "portrait",  // it's a Shorts URL (9:16 vertical)
    duration: "Short",
    featured: true,
  },

  // ─────────────────────────────────────────────────────────────────────────
  // COLLECT THESE. The entries below are TEMPLATES showing the shape only.
  // Replace each one fully with a REAL student before uncommenting. Aim for
  // result-specific, named, with a photo or short clip. One Blueprint buyer,
  // one Community member, one Workshop attendee covers your three buy pages.
  // ─────────────────────────────────────────────────────────────────────────
  // {
  //   id: "firstname-footwork",
  //   name: "Firstname",
  //   context: "Footwork Blueprint · 30 Days",
  //   quote: "Concrete change, their words. What holds now that broke before.",
  //   photo: "/images/testimonials/firstname.jpg",
  // },
  // {
  //   id: "firstname-community",
  //   name: "Firstname",
  //   context: "Greatness Community · 3 Months",
  //   quote: "What the weekly correction fixed that a hundred reps did not.",
  //   photo: "/images/testimonials/firstname-2.jpg",
  // },
];

// Verifiable usage proof. Keep these TRUE and update as they grow.
// Usage/training counts are stronger and safer to stand behind than raw
// "units sold". If you ever cite a sales number, it must be defensible.
export const proofStats = {
  fightersTraining: "120+", // fighters training the system (per /footwork-foundation)
};
