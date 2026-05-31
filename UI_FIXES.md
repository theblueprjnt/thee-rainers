# UI Fixes — Thee Rainers
Audit date: 2026-05-27 · Awaiting approval before any code is touched.

---

## Issue 1 — Mobile Navigation Overlap

**Root cause — z-index inversion.**
`#site-nav` header is `z-50`. The `#mobile-menu` fullscreen overlay is `z-40`. The menu opens behind the header bar, so the logo and hamburger button bleed through the menu rather than the menu taking full control. On iOS Safari `overflow:hidden` on `<body>` is also unreliable without `-webkit-overflow-scrolling` containment.

**Secondary:** No animation — the menu snaps open/closed with a `hidden`/`flex` toggle. No transition.

**Files touched:**
- `src/components/site/Nav.astro`

**Exact changes:**

1. Raise `#mobile-menu` from `z-40` → `z-[60]` (above the nav header's `z-50`)
2. Replace the `hidden`/`flex` toggle with an opacity + pointer-events transition for a smooth fade:
   - Base state: `opacity-0 pointer-events-none translate-y-[-8px]`
   - Open state: `opacity-100 pointer-events-auto translate-y-0`
   - Add `transition-all duration-200 ease-out` to the menu div
3. Add `overscroll-behavior: contain` and `touch-action: none` to the menu div for iOS scroll-lock reliability
4. Keep `document.body.style.overflow = 'hidden'/'auto'` as-is (belt and suspenders)

**Before (line 22):**
```html
<div id="mobile-menu" class="fixed inset-0 bg-white z-40 flex-col items-center justify-center gap-6 hidden">
```
**After:**
```html
<div id="mobile-menu" class="fixed inset-0 bg-white z-[60] flex flex-col items-center justify-center gap-6
  opacity-0 pointer-events-none translate-y-[-8px]
  transition-all duration-200 ease-out"
  style="overscroll-behavior:contain; touch-action:none;">
```

**JS change:** Replace `classList.toggle('hidden')` / `classList.toggle('flex')` with `classList.toggle('opacity-0')`, `classList.toggle('pointer-events-none')`, `classList.toggle('translate-y-[-8px]')`.

---

## Issue 2 — Lever Audit Contrast (WCAG 2.2 AA)

**Root cause — opacity-based color rendering extremely low contrast on white.**
`#0A0A0A` (near-black) at `/30` opacity on white = effective `#CBCBCB` → ~1.7:1 contrast. WCAG AA requires 4.5:1 for normal text, 3:1 for large text.

**File touched:**
- `src/pages/lever-audit.astro`

**Line-by-line changes:**

| Line | Current class | Proposed class | Effective hex | New ratio |
|------|--------------|---------------|--------------|-----------|
| 33 | `text-[#0A0A0A]/30` | `text-[#0A0A0A]/55` | ~`#747474` | ~5.3:1 ✓ AA |
| 76 | `text-[#0A0A0A]/60` | `text-[#0A0A0A]/70` | ~`#494949` | ~8.6:1 ✓ AA |
| 77 | `text-[#0A0A0A]/20` | `text-[#0A0A0A]/40` | ~`#989898` | ~3.3:1 ✓ AA large |
| 100 | `text-[#0A0A0A]/15` | `text-[#0A0A0A]/25` | ~`#BFBFBF` | decorative label |
| 102 | `text-[#0A0A0A]/60` | `text-[#0A0A0A]/70` | ~`#494949` | ~8.6:1 ✓ AA |
| 103 | `text-[#0A0A0A]/20` | `text-[#0A0A0A]/40` | ~`#989898` | ~3.3:1 ✓ AA large |
| 116 | `text-white/50` | `text-white/70` | on `#0A0A0A` | ~10:1 ✓ AA |
| 120 | `text-white/50` | `text-white/70` | on `#0A0A0A` | ~10:1 ✓ AA |
| 124 | `text-white/50` | `text-white/70` | on `#0A0A0A` | ~10:1 ✓ AA |

All changes stay within the brand's muted aesthetic — this raises legibility without brightening the palette.

---

## Issue 3 — Desktop Layout Clash (Button Overflow)

**Root cause — `sm:flex-row` fires too early on the index.astro hero.**
At `md:` breakpoint (768px), the left column of the 60/40 grid is ~460px wide. With `px-14` padding that leaves ~348px usable. Two `whitespace-nowrap` buttons ("Get Free 30-Day Foundation →" + "See the Blueprints →") in a `flex-row` at `px-10` are ~390px combined — wider than the available space. The second button wraps OR overflows into the 40% image panel.

**Files touched:**
- `src/pages/index.astro` (hero CTA container, line 36)

**Exact change:**

Line 36 — change the button container's row breakpoint from `sm:` to `lg:`:

**Before:**
```html
<div class="flex flex-col sm:flex-row gap-4">
```
**After:**
```html
<div class="flex flex-col lg:flex-row gap-3">
```

This keeps both buttons stacked on mobile and mid-desktop (768px–1023px) — where there isn't room — and only rows them at 1024px+ where the 60% column has adequate width (~614px usable).

`gap-4` → `gap-3` trims 4px from the gap to give the row layout even more breathing room at `lg:`.

---

## Issue 4 — Sparring Image: Gritty Motion Aesthetic

**Root cause — `sparring_withnetherlands.png` is a low-resolution capture (likely a phone video screenshot) rendered at full hero size with no treatment. It reads as a mistake at 100% scale.**

**Objective:** Style it as an intentional "fast-motion, analytical frame" visual — high contrast, desaturated, slight blur — consistent with a "Boxing Science" diagnostic aesthetic.

**Files touched:**
- `src/pages/community/index.astro` (lines 80 and 124)

**Proposed CSS filter treatment:**

```
grayscale contrast-[1.2] brightness-[0.85] blur-[1.5px]
```

Breakdown:
- `grayscale` — removes color noise, makes the low-res PNG look editorial rather than amateur
- `contrast-[1.2]` — punches up edges and forms, compensates for the desaturation going flat
- `brightness-[0.85]` — drops the base exposure slightly so the overlay text reads cleanly
- `blur-[1.5px]` — the key move: soft motion blur implies speed without needing a sharp image; low-res becomes an asset rather than a liability

**Mobile strip (line 80):**

Before:
```html
class="w-full h-full object-cover object-top"
```
After:
```html
class="w-full h-full object-cover object-top grayscale contrast-[1.2] brightness-[0.85] blur-[1.5px]"
```

**Desktop panel (line 124):**

Before:
```html
class="absolute inset-0 w-full h-full object-cover object-top opacity-80"
```
After:
```html
class="absolute inset-0 w-full h-full object-cover object-top opacity-90 grayscale contrast-[1.2] brightness-[0.85] blur-[1.5px]"
```
(`opacity-80` → `opacity-90` because the grayscale + contrast treatment already darkens; keeping it too low washes out the punch.)

**Optional enhancement (additive, not required for approval):**
Add a single-pixel `#0057FF/8` overlay div inside the image container — a barely-visible blue tint that ties the image to the brand palette without making it obvious. This is the technique Apple uses on their hero product shots.

---

## Summary

| # | File | Lines touched | Nature of change |
|---|------|--------------|-----------------|
| 1 | `src/components/site/Nav.astro` | 22, 42–50 | z-index fix + CSS transition for mobile menu |
| 2 | `src/pages/lever-audit.astro` | 33, 76–77, 100–103, 116, 120, 124 | Opacity increases for WCAG AA contrast |
| 3 | `src/pages/index.astro` | 36 | `sm:flex-row` → `lg:flex-row` on hero CTA container |
| 4 | `src/pages/community/index.astro` | 80, 124 | Grayscale + contrast + blur filter on sparring image |

No Stripe logic, Make.com webhooks, or pricing touched. Ready to execute on your "go".
