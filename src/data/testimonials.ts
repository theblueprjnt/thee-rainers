// src/data/testimonials.ts
// Single source of truth for social proof. Mirrors social-stats.ts.
//
// HARD RULE: every entry is REAL and CONSENTED. Do not invent. Do not include
// anyone who has not explicitly agreed to public display. A withdrawn consent
// is a hard remove — never "subtle". This file is reviewed before every push.
//
// ORDERING NOTE: The array order encodes ICP relevance — the visitor sees the
// featured spotlight first, then the row in array order. Most-similar-to-ICP
// first. The visitor's eye moves down the page; we put the strongest match
// where the eye lands.
//
// WHY THESE FIELDS:
// - `setting` (remote | in_person) maps a testimonial to the right product.
//   Remote = "I trained alone from the blueprint" -> sells the Blueprints.
//   In-person = "I trained live with Rainers" -> sells the Workshop / coaching.
// - `persona` is the self-identification hook. A 50yo visitor converts when he
//   sees a 50yo win; a woman converts when she sees a woman; a busy professional
//   converts when he sees another busy professional. Match proof to viewer.
// - `youtubeId` from unlisted Shorts. Vertical (9:16) — the component frames
//   them vertically, no letterboxing. Leave empty for text-only testimonials.

export interface Testimonial {
  id: string;
  name: string;
  persona: string;          // self-ID hook: who this viewer recognizes themselves in
  setting: "remote" | "in_person";
  youtubeId?: string;       // unlisted Short ID (optional — empty = text-only card)
  quote: string;            // their words — REPLACE placeholders with real lines
  featured?: boolean;       // at most ONE featured per rendered section
}

export const testimonials: Testimonial[] = [
  // ─── 1. GIANCARLO — entrepreneur, 6 months online coaching ──────────────
  // Closest to ICP: paying online client who went the distance. Featured.
  {
    id: "giancarlo-remote",
    name: "Giancarlo",
    persona: "Entrepreneur · 6 months online",
    setting: "remote",
    youtubeId: "VCj0Dgfoako",
    // Pulled from his existing on-site testimonial. Real line, his words.
    quote:
      "My footwork makes sense. I can see openings instead of just swinging.",
    featured: true,
  },

  // ─── 2. KEVIN — civil engineer, trains at home ──────────────────────────
  // Working professional, trained remote. Strong ICP signal: same demographic
  // as your highest-intent buyers (busy professionals with structured minds).
  {
    id: "kevin-remote",
    name: "Kevin",
    persona: "Civil engineer · Trains at home",
    setting: "remote",
    youtubeId: "_W5iFlCIKow",
    // No quote — video carries the proof. Card renders as video + name + persona.
    quote: "",
  },

  // ─── 3. ELIZABETH — digital marketer, in person ─────────────────────────
  // ICP-adjacent: woman, working professional, in-person. Persona is "moving
  // away" per Rainers, but real, female, and a working professional — useful
  // diversity in the lineup.
  {
    id: "elizabeth-inperson",
    name: "Elizabeth",
    persona: "Digital marketer · Trained in person",
    setting: "in_person",
    youtubeId: "KOWohmgNMNI",
    // PLACEHOLDER — pull her real line. She's on pads, in person.
    quote: "REPLACE: Elizabeth's strongest real sentence about what changed.",
  },

  // ─── 4. RICHARDS — startup founder, remote + sparring ────────────────────
  // Per Rainers's correction: he is REMOTE + sparring, not pure in-person.
  // The footage shows him sparring 3 months in.
  {
    id: "richards-remote",
    name: "Richards",
    persona: "Startup founder · Remote + sparring",
    setting: "remote",
    youtubeId: "LY8MNzbhg2o",
    // PLACEHOLDER — pull his real line.
    quote: "REPLACE: Richards's strongest real sentence about what changed.",
  },

  // ─── Removed entries ─────────────────────────────────────────────────────
  // Jacob (CH6Iw2djxqE):   declined consent to public sharing. Hard remove.
  // Kristaps (4TllJueBQKo): dropped per Rainers's updated ICP lineup.
  // 50+ student (_W5iFlCIKow): dropped per Rainers's updated ICP lineup.
];

// Verifiable usage proof. Keep TRUE. Update as it grows.
export const proofStats = {
  fightersTraining: "120+", // fighters training the system (per /footwork-foundation)
};

// Helpers the component uses to match proof to context.
export const remoteTestimonials = () =>
  testimonials.filter((t) => t.setting === "remote");
export const inPersonTestimonials = () =>
  testimonials.filter((t) => t.setting === "in_person");
