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

- [x] Refine the master `images/vitni.svg` into a friendly comic helper with crisp ink contours, clean closed shapes, flat RepairLens green/lime/coral fills, two expressive eyes, warm smile, visible small wrench/screwdriver, and a compact body silhouette that remains clear at the existing placements.
- [x] Derive `images/vitni-mark.svg` from the same head/eye/tool language, simplifying detail rather than inventing a different character. Keep the face centered and legible at 30×30 px.
- [x] Preserve SVG accessibility titles/descriptions and keep decorative use marked with empty alt or `aria-hidden` at each consuming page.
- [x] Preview both vectors at 30 px, 80 px, 112 px, and 220 px; adjust line widths and spacing until eyes/tool remain distinguishable.

## Task 2: Rebuild Vitni’s Lottie animation from the refreshed model

**Files:**
- Create: `animations/vitni-repair-v4.json`
- Create: `scripts/build-vitni-lottie.py`
- Modify: `hero-lottie.js`, `sw.js`, `index.html`, `guides.html`, `flow-ui.css`, `guide-ai.css`, `styles.css`

- [x] Generate native vector shapes from the SVG master into matching 320×360 Lottie coordinates; keep the deliverable resolution independent of PNG layers.
- [x] Create the compact Lottie named `Vitni · Ligne claire repair sidekick` with a gentle bob, two occasional blinks, and two small wrench waves in a 5-second loop.
- [x] Pause motion while the page is hidden, remove the pause control, and show the static master artwork for reduced-motion users or if rendering fails.
- [x] Point the homepage and guide-library canvases to `vitni-repair-v4.json`, size the canvases explicitly, and keep autoplay off when `prefers-reduced-motion` matches.
- [x] Bump the service-worker cache, retain the v4 animation and refreshed SVG art, and remove the unused v3 animation and image layers.
- [x] Parse and manually preview the generated animation in the homepage and guide-library canvases without image-layer requests.

## Task 3: Refresh the branded OG card and synchronize every placement

**Files:**
- Modify: `images/og/repairlens-share.svg`
- Modify: `images/og/repairlens-share.png`
- Modify: page templates only if any Vitni placement still points at different mascot artwork
- Modify: `scripts/build-site.mjs`, `library.css` to add Vitni beside guide/story safety notes

- [x] Update the editable OG source to use the refreshed mascot while retaining a 1200×630 canvas, current “Keep good things going” headline, high contrast, and safe social-platform crop margins.
- [x] Export `images/og/repairlens-share.png` at exactly 1200×630 with `sips`; confirm metadata points to the PNG, not its SVG source.
- [x] Search all tracked HTML/CSS/JS/templates for every `vitni.svg`, `vitni-mark.svg`, and Lottie path. Confirm the logo, homepage, diagnose prompt, guide library, guide/story safety notes, and OG card use the refreshed family.
- [x] Leave generated repair-story and step illustrations unchanged unless they explicitly depict Vitni.
- [x] Run `npm run build` and visually inspect homepage and guide library at desktop scale; confirm eyes, wrench, and animation render.
- [x] Keep the static master art visible when reduced motion is requested; run `git diff --check` and review the final asset references.
- [x] Commit with `feat(brand): refresh Vitni in ligne claire style`.

## Handoff

The user approved the ligne claire visual direction and this asset scope. Execute inline because all derivatives depend on the master SVG and one Lottie model; no further scope approval is needed.
