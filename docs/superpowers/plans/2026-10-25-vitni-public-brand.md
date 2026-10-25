# Vitni Public Brand Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make Vitni the consistent product name across the public RepairLens app, its installed PWA, and link previews.

**Architecture:** Update user-visible brand strings and public metadata in place. Keep existing canonical URLs and technical storage, cache, route, database, analytics, and asset identifiers stable. Update the current SVG social card and rasterize it to the existing PNG path.

**Tech Stack:** Next.js App Router, TypeScript, static JSON/SVG assets, macOS `sips` for the 1200×630 PNG export.

**Spec:** `docs/superpowers/specs/2026-10-25-vitni-public-brand-design.md`

## Global Constraints

- Preserve all current routes and `https://vitni.cc` canonical URLs.
- Preserve analytics local-storage/event identifiers, service-worker caches, database/schema names, API routes, and filenames.
- Keep the current character artwork, palette, layout, and tagline; change product naming only.
- Do not add or run automated tests; run typecheck, lint, visual asset inspection, and `git diff --check`.
- Use Conventional Commit messages.

---

### Task 1: Rename visible app identity and metadata

**Files:**

- Modify: `src/components/site-header.tsx`
- Modify: `src/components/site-footer.tsx`
- Modify: `src/app/not-found.tsx`
- Modify: `src/app/layout.tsx`
- Modify: `src/app/page.tsx`
- Modify: `src/app/guides/page.tsx`
- Modify: `src/app/guides/[slug]/page.tsx`
- Modify: `src/app/stories/[slug]/page.tsx`
- Modify: `src/app/repairs/[token]/page.tsx`
- Modify: `src/components/google-analytics.tsx`
- Modify: `src/components/pwa-registrar.tsx`
- Modify: `src/lib/analytics.ts`
- Modify: `src/lib/repair-ai.ts`
- Modify: `src/app/llms.txt/route.ts`
- Modify: `src/app/llms-full.txt/route.ts`
- Modify: `public/manifest.webmanifest`
- Modify: `README.md`

**Interfaces:**

- Routes, analytics event names/storage keys, PWA cache names, and backend identifiers remain unchanged.
- Page titles and social site name use `Vitni`; generic metadata uses `Vitni — Keep good things going`.
- `getSafePageView()` continues to return the same path and page-type values; only its fixed page titles change to Vitni.

- [ ] **Step 1: Replace visitor-facing brand labels and assistant identity**

Change header/footer text and accessible labels, not-found copy, consent-banner copy, and PWA error copy from RepairLens to Vitni. Update the repair assistant system prompt to identify as Vitni. Keep all analytics `repairlens.*` keys, script IDs, service-worker cache names, and asset paths unchanged.

- [ ] **Step 2: Update page, social, and install metadata**

Set `metadata.title`, `applicationName`, Open Graph `siteName` and title, Twitter title, route-specific guide/story/shared-repair title suffixes, and the homepage title to Vitni. Replace metadata image alt text with Vitni wording. Set manifest `name` to `Vitni — Keep good things going` and `short_name` to `Vitni`; retain existing icon and manifest paths.

- [ ] **Step 3: Update machine-readable public descriptions and README**

Change the generated `llms.txt` and `llms-full.txt` site heading and description to Vitni. Update README title/product overview and GA4 wording to use Vitni as the product name. Keep historical design records and old technical identifiers untouched.

### Task 2: Refresh and inspect the social preview image

**Files:**

- Modify: `public/images/og/repairlens-share.svg`
- Modify: `public/images/og/repairlens-share.png`

**Interfaces:**

- Existing Open Graph image URL stays `/images/og/repairlens-share.png`, so published metadata and social integrations do not break.
- SVG remains the editable source and PNG remains exactly 1200×630.

- [ ] **Step 1: Update the vector card text and accessibility description**

Change the SVG title, description, and visible product label from RepairLens to Vitni. Preserve the existing 1200×630 viewbox, tagline, palette, Vitni art, composition, and embedded artwork.

- [ ] **Step 2: Export the existing PNG path and inspect it**

Run `sips -s format png public/images/og/repairlens-share.svg --out public/images/og/repairlens-share.png`. Confirm dimensions with `sips -g pixelWidth -g pixelHeight public/images/og/repairlens-share.png` and visually inspect the PNG. The dimensions must be 1200×630 and the rendered product label must read Vitni.

### Task 3: Validate, document, and commit the public rebrand

**Files:**

- Inspect: all Task 1 and Task 2 files
- Modify: `docs/superpowers/specs/2026-10-25-vitni-public-brand-design.md`

- [ ] **Step 1: Search for remaining public RepairLens branding**

Run `rg -n -i 'RepairLens|RepairLens' src public README.md`. Update any visitor-facing or crawler-facing product-name occurrence. Keep only the approved internal identifiers, preserved asset paths, and the historical project directory/package name.

- [ ] **Step 2: Run non-test checks**

Run `./node_modules/.bin/tsc --noEmit`, `./node_modules/.bin/eslint .`, and `git diff --check`. Inspect the rendered home and guide metadata in the open browser. Do not run automated tests.

- [ ] **Step 3: Record completion and commit**

Mark completed steps in the plan. Stage the public branding, artwork, and plan/spec files. Commit with `feat(brand): rename public app identity to Vitni`.
