# Vitni Ligne Claire Refresh Implementation Plan

> **For agentic workers:** Implement inline, in order. Keep the master character and every derivative visually aligned.

**Goal:** Give Vitni one friendly, French BD ligne claire identity across the RepairLens logo, page illustrations, Lottie animation, and OG card.

**Architecture:** Refine the existing editable SVG as the master mascot, create a legible compact logo mark, and use that same character model in the existing Lottie-powered placements. Refresh the social image from the same artwork and keep asset URLs/versioning consistent for the Node-generated `dist/` site and service worker.

**Tech Stack:** Existing SVG, Lottie JSON, DotLottie player, static HTML/CSS, Node build, and macOS `sips` to rasterize the 1200×630 OG PNG. No new runtime dependencies.

**Spec:** `docs/superpowers/specs/2026-10-24-vitni-ligne-claire-design.md`

## Global Constraints

- Use warm Franco-Belgian ligne claire styling: confident dark outlines, flat RepairLens colors, expressive visible eyes, friendly proportions, small comic accents.
- Do not imitate any named character or living artist.
- Keep Vitni’s eyes and repair tool visible at logo, mobile, guide, and share-card sizes.
- Do not change repair instructions, safety copy, product flow, or non-mascot guide/story imagery.
- Respect `prefers-reduced-motion`; existing reduced-motion users see static Vitni with no autoplay.
- Do not add or run test suites; verify with build, file dimensions, and manual visual browser review.
- Use a Conventional Commit for the final code/assets.

---

## Task 1: Refine the master mascot and compact brand mark

**Files:**
- Modify: `images/vitni.svg`
- Modify: `images/vitni-mark.svg`
- Modify: any HTML/CSS selectors only if the artwork aspect ratio changes

- [ ] Refine the master `images/vitni.svg` into a friendly comic helper with crisp ink contours, clean closed shapes, flat RepairLens green/lime/coral fills, two expressive eyes, warm smile, visible small wrench/screwdriver, and a compact body silhouette that remains clear at the existing placements.
- [ ] Derive `images/vitni-mark.svg` from the same head/eye/tool language, simplifying detail rather than inventing a different character. Keep the face centered and legible at 30×30 px.
- [ ] Preserve SVG accessibility titles/descriptions and keep decorative use marked with empty alt or `aria-hidden` at each consuming page.
- [ ] Preview both vectors at 30 px, 80 px, 112 px, and 220 px; adjust line widths and spacing until eyes/tool remain distinguishable.

## Task 2: Rebuild Vitni’s Lottie loop from the refreshed model

**Files:**
- Create: `animations/vitni-repair-v4.json`
- Modify: `hero-lottie.js`, `sw.js`

- [ ] Create a compact 320×360 Lottie named `Vitni · Ligne claire repair sidekick` that keeps the same face, body, outlines, and tool as the master SVG; play one gentle 3-second entrance motion with a blink, slight body bounce, and small tool lift/wave, then hold a still pose instead of continuously looping.
- [ ] Keep movement slow and interruptible when a page is hidden. Do not add a pause control; the existing accessibility task owns reduced-motion static fallback behavior.
- [ ] Point every hero/detail canvas to `vitni-repair-v4.json`. Keep the existing DotLottie player and do not autoplay when `prefers-reduced-motion` matches.
- [ ] Update the service-worker asset list/version to cache v4 and the refreshed SVG mark/master; remove v3 from the active cache list after confirming no page references it.
- [ ] Check JSON parses and the Lottie loads in the existing hero and guide-detail canvases without network-path errors.

## Task 3: Refresh the branded OG card and synchronize every placement

**Files:**
- Modify: `images/og/repairlens-share.svg`
- Modify: `images/og/repairlens-share.png`
- Modify: page templates only if any Vitni placement still points at different mascot artwork

- [ ] Update the editable OG source to use the refreshed mascot while retaining a 1200×630 canvas, current “Keep good things going” headline, high contrast, and safe social-platform crop margins.
- [ ] Export `images/og/repairlens-share.png` at exactly 1200×630 with `sips`; confirm metadata points to the PNG, not its SVG source.
- [ ] Search all tracked HTML/CSS/JS/templates for every `vitni.svg`, `vitni-mark.svg`, and Lottie path. Confirm the logo, homepage, diagnose prompt, guide library, every generated guide detail, and OG card use the refreshed family.
- [ ] Leave generated repair-story and step illustrations unchanged unless they explicitly depict Vitni.
- [ ] Run `npm run build` and visually inspect homepage, guide library, one bike guide, one home guide, one clothes guide, and one story page at desktop and mobile widths. Confirm the eyes/tool remain clear and all animation assets load.
- [ ] Check reduced-motion mode shows the static refreshed mascot; run `git diff --check` and review the final asset references.
- [ ] Commit with `feat(brand): refresh Vitni in ligne claire style`.

## Handoff

The user approved the ligne claire visual direction and this asset scope. Execute inline because all derivatives depend on the master SVG and one Lottie model; no further scope approval is needed.
