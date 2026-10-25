# GA4 Usage Tracking Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Measure how visitors use the RepairLens repair journey with consent-gated, privacy-safe Google Analytics 4 events.

**Architecture:** Add a small client analytics component to the App Router root. It loads `gtag.js` only after opt-in, sends manually sanitized page views, and delegates static click/search events. Repair request events use a typed client helper and include only coarse, non-user-entered properties.

**Tech Stack:** Next.js App Router `next/script`, React client components, TypeScript, `localStorage`; no additional runtime dependency.

**Spec:** `docs/superpowers/specs/2026-10-25-ga4-privacy-first-design.md`

## Global Constraints

- Use opt-in-only loading; no Google tag request before consent.
- Read the public Measurement ID from `NEXT_PUBLIC_GA_MEASUREMENT_ID`; without a valid `G-...` ID, render no banner, script, or event.
- Do not send repair descriptions, photos, filenames, raw guide searches, guide slugs, generated part names, personal data, unsanitized browser URLs, or error messages. Build page locations from the origin plus an approved route template.
- Disable automatic page views and send one sanitized page view per route change.
- Do not enable automatic enhanced-measurement browser-history page changes, outbound-click, or site-search events.
- Store consent in local storage and provide a persistent control to change it.
- Do not modify `.env` or commit secrets.

---

### Task 1: Add consent-gated GA loading and safe event primitives

**Files:**

- Create: `src/lib/analytics.ts`
- Create: `src/components/google-analytics.tsx`
- Modify: `src/app/layout.tsx`
- Modify: `src/components/site-footer.tsx`
- Modify: `src/app/globals.css`
- Modify: `.env.example`

**Interfaces:**

- `trackAnalyticsEvent(name, payload)` is the only app-facing GA event API. It accepts a mapped, event-specific payload and returns without sending unless the configured Measurement ID is valid, consent is granted, and `window.gtag` is ready.
- `getSafePageView(pathname)` returns `{ page_path, page_title, page_type }`; query strings are not accepted. Guide and story details map to fixed route templates and generic titles, and all unknown paths map to `/[page]/`.
- `GoogleAnalytics` owns consent state, consent-banner rendering, `gtag.js` loading, manual route page views, and the preferences-open event.
- `AnalyticsPreferencesButton` in the footer dispatches a same-page event that opens the consent controls.

- [x] **Step 1: Define fixed event names and page sanitization**

Add an `AnalyticsEventPayloads` map associating every approved event with its exact payload, then type `trackAnalyticsEvent` from that map. It returns immediately unless `NEXT_PUBLIC_GA_MEASUREMENT_ID` matches `/^G-[A-Z0-9]+$/`, local storage or the current-tab consent fallback is `granted`, and `window.gtag` is ready. Add `getSafePageView(pathname: string)` that maps `/guides/<slug>` to `/guides/[guide]` and title `Repair guide`, `/stories/<slug>` to `/stories/[story]` and title `Repair story`, `/guides/` to `Repair library`, `/` to `RepairLens`, and all other paths to `/[page]/` and the fixed `RepairLens page` title. Set `page_type` to `home`, `guide_library`, `guide_detail`, `story_detail`, or `other`.

```ts
export type AnalyticsEventName =
  | "page_view"
  | "repair_flow_opened"
  | "guide_library_opened"
  | "community_help_opened"
  | "guide_search_submitted"
  | "guide_opened"
  | "repair_request_started"
  | "repair_guide_completed"
  | "repair_guide_failed"
  | "parts_link_opened";

export type AnalyticsEventPayloads = {/* exact approved event-specific payload map */};
export function trackAnalyticsEvent<EventName extends AnalyticsEventName>(name: EventName, payload: AnalyticsEventPayloads[EventName]): void;
export function getSafePageView(pathname: string): {
  page_path: string;
  page_title: string;
  page_type: "home" | "guide_library" | "guide_detail" | "story_detail" | "other";
};
```

- [x] **Step 2: Build a non-modal consent component and deferred tag loader**

Create `GoogleAnalytics` as a client component using `usePathname` and `next/script`. Initialize consent state as `unknown`, then read local storage in an effect. Show the banner only when an ID is valid and consent is unknown. On accept, store `granted`; inject the inline gtag bootstrap before the external script, set analytics consent to granted and advertising consent values to denied, configure with `send_page_view: false`, and set `allow_google_signals: false` and `allow_ad_personalization_signals: false`. After the external script loads, send the initial sanitized page view and send one more sanitized page view when `usePathname()` changes. On reject, store `denied` and never inject the script. If a previously granted visitor revokes, update gtag consent to denied and stop all calls to `trackAnalyticsEvent`.

The banner text must say Google Analytics is optional and used to understand site usage; include **Accept analytics** and **Reject optional analytics** buttons. It must not trap focus. Use a labeled region, visible focus styles, and a persistent footer button named **Analytics preferences**.

- [x] **Step 3: Mount the component and expose the Measurement ID setting**

Render `<GoogleAnalytics />` in `src/app/layout.tsx` without adding a client boundary around the app. Add `<AnalyticsPreferencesButton />` in `src/components/site-footer.tsx`. Add `NEXT_PUBLIC_GA_MEASUREMENT_ID=` with a comment to `.env.example`; do not change `.env`.

- [x] **Step 4: Style the banner for mobile and desktop**

Add a fixed bottom consent panel with a restrained background, border, and shadow in `src/app/globals.css`. Keep the copy readable at 320 px, place the two actions together where space permits, stack them on narrow screens, and give keyboard focus a visible outline.

- [x] **Step 5: Run static checks for this slice**

Run `./node_modules/.bin/tsc --noEmit` and `./node_modules/.bin/eslint src/lib/analytics.ts src/components/google-analytics.tsx src/components/site-footer.tsx src/app/layout.tsx`. Resolve errors before proceeding.

### Task 2: Instrument the repair, guides, parts, and community journey

**Files:**

- Modify: `src/components/home-page.tsx`
- Modify: `src/components/guide-card.tsx`
- Modify: `src/app/guides/page.tsx`
- Modify: `src/app/guides/[slug]/page.tsx`
- Modify: `src/components/repair-request.tsx`
- Modify: `src/components/google-analytics.tsx`

**Interfaces:**

- Static links use `data-analytics-event` and fixed `data-analytics-location` or `data-analytics-link-type` values. The document listener accepts only the event names and value sets listed in the spec.
- The guide search listener reads only the area allowlist `All | Bike | Home | Clothes` and whether `q.trim()` is nonempty. It never transmits `q`.
- Repair form code calls `trackAnalyticsEvent` directly and sends only `has_photo`, the validated safety enum, `saved`, `reused`, or a fixed failure stage.

- [x] **Step 1: Mark static navigation and outbound links**

Add static attributes to homepage repair, guide, and community CTAs; the community map/directory/venue links; guide-card links; and part links on guide-detail and generated-plan views. Use only `location: home_hero | site_nav | footer`, `link_type: map | directory | venue`, and `page_context: guide_detail | generated_plan`. Never add a slug, title, address, link URL, or dynamic item name as an event property.

```tsx
<Link href="/guides/" data-analytics-event="guide_library_opened" data-analytics-location="home_hero">
  Browse our guides
</Link>
```

- [x] **Step 2: Handle delegated clicks and guide-search submissions**

In `GoogleAnalytics`, add one document click listener for `[data-analytics-event]` and one submit listener for `form[data-analytics-form="guide-search"]`. Map allowed attributes to the fixed event schema. For a search, send `area` from the allowlist and `has_query: Boolean(q.trim())`; do not send query text or result titles. For guide opens, send the static source only.

- [x] **Step 3: Record repair request milestones without form content**

In `src/components/repair-request.tsx`, emit `repair_request_started` after client-side validity passes and before fetch with `{ has_photo: Boolean(image) }`. For a successful JSON response, emit `repair_guide_completed` with `{ safety: result.assessment.safety, saved: result.saved, reused: Boolean(result.reused), has_photo: Boolean(image) }`. For a non-OK response or thrown request, emit `repair_guide_failed` with `{ stage: "request" }`. Do not pass `description`, `image`, filename, server error text, or generated guide details to Analytics.

```ts
trackAnalyticsEvent("repair_request_started", { has_photo: Boolean(image) });
// After a successful response:
trackAnalyticsEvent("repair_guide_completed", {
  safety: data.assessment.safety,
  saved: data.saved,
  reused: Boolean(data.reused),
  has_photo: Boolean(image),
});
```

- [x] **Step 4: Run static checks and inspect event call sites**

Run `./node_modules/.bin/tsc --noEmit` and `./node_modules/.bin/eslint .`. Search all `trackAnalyticsEvent` and `data-analytics-` call sites; confirm that only static enum values and booleans/numbers enter the event properties.

### Task 3: Document the tracking plan and validate the configured/disabled states

**Files:**

- Create: `docs/analytics/ga4-tracking-plan.md`
- Modify: `README.md`
- Inspect: `src/app/layout.tsx`, `src/components/google-analytics.tsx`, `.env.example`

- [x] **Step 1: Record the live event catalog**

Create `docs/analytics/ga4-tracking-plan.md` with the event names, trigger, properties, and explicit exclusions from the approved design. Explain that page views use template paths for dynamic detail routes and guide searches exclude raw terms.

- [x] **Step 2: Document environment setup and GA4 property settings**

In `README.md`, explain how to create or select a GA4 web data stream, copy its `G-...` Measurement ID into `NEXT_PUBLIC_GA_MEASUREMENT_ID` locally and in the deployment environment, redeploy, and verify opt-in events in GA4 DebugView. Tell the operator to disable automatic enhanced-measurement browser-history page changes, outbound clicks, and site-search events because dynamic destinations and queries can contain user-entered or generated text. Do not claim that analytics is active until the ID is configured.

- [x] **Step 3: Verify the no-ID state in the local browser**

With the current environment, where no GA ID is configured, inspect `/` and `/guides/`. Confirm neither page renders an analytics consent banner, creates a `gtag` script, nor makes a request to `googletagmanager.com` or `google-analytics.com`. Confirm the visible page and guide search still work. Browser verification of opt-in, revoke, and GA4 DebugView requires the owner's actual Measurement ID; do not inject a fake ID.

- [x] **Step 4: Run final non-test checks and inspect the diff**

Run `./node_modules/.bin/tsc --noEmit`, `./node_modules/.bin/eslint .`, and `git diff --check`. Inspect the staged diff and ensure `.env` is unchanged. Browser verification of opt-in, revoke, and GA4 DebugView requires the owner's actual Measurement ID; report that remaining setup clearly if it is still unavailable.

---

## Spec coverage self-review

- Sanitized manual page views: Task 1.
- Search/open, request success/failure, parts, and community journey events: Task 2.
- Accessible opt-in/reject/preferences controls and consent persistence: Task 1.
- No-ID inactive behavior and env configuration: Tasks 1 and 3.
- No user-entered data or dynamic URL properties: Tasks 1 and 2.
- Tracking documentation and setup handoff: Task 3.
- No secrets committed and no changes to `.env`: all tasks.
