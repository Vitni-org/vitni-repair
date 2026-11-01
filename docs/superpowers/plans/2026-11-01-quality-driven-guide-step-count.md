# Quality-Driven Guide Step Count Implementation Plan

> **For agentic workers:** This plan is being executed inline in this chat, consistent with the user's prior preference. Track each completed step with the checkbox syntax below.

**Goal:** Let each generated repair guide include the written steps needed for a complete, safe procedure, with up to 20 text steps and illustrations for the first 10.

**Architecture:** Share the written and illustrated step limits in a small app module. Apply those limits to on-demand generation, translation, persistence, guide illustration requests and retries; update client placeholders to distinguish text-only later steps. Align the Cloudflare weekly guide scout with the same 20/10 rules and raise its per-run image budget to 11 including its cover.

**Tech Stack:** Next.js App Router, TypeScript, Zod, OpenAI Responses API, Supabase guide storage, Cloudflare Workers Workflows, next-intl.

**Spec:** `docs/superpowers/specs/2026-11-01-quality-driven-guide-step-count-design.md`

## Global Constraints

- Support at most 20 written guide steps; this is a resource ceiling, not a target.
- Generate no more than 10 step illustrations per guide; keep all later written steps intact.
- EN and FR must have the same step count and order.
- Keep hazardous repairs within the existing stop/referral safety rules.
- Do not add or run tests unless requested; review the changed paths without invoking test commands.
- Preserve conventional commit style; commit this feature as `feat(guides): support detailed repair steps`.

---

### Task 1: Align on-demand guide generation, storage, and image eligibility

**Files:**
- Create: `src/lib/guide-step-limits.ts`
- Modify: `src/lib/repair-ai.ts`

**Interfaces:**
- Export `MAX_REPAIR_GUIDE_STEPS = 20` and `MAX_REPAIR_STEP_ILLUSTRATIONS = 10` from `guide-step-limits.ts` for shared Next.js modules.
- Keep `illustrateSteps({ title, category, steps, cacheKey? })` returning one `(string | null)` entry per written step; generate only indexes 0–9 and fill remaining indexes with `null`.

- [ ] **Step 1: Add the shared limits module.** Export the two named integer constants above and no other behavior.
- [ ] **Step 2: Expand the on-demand structured output schema.** In `repair-ai.ts`, use the shared 20-step maximum for the English Zod schema, French translation schema, strict OpenAI JSON schema, and illustration request body. Keep a minimum of two steps for safe DIY output and allow zero in translated unsafe/no-step outputs.
- [ ] **Step 3: Replace fixed-count prompt language.** Tell the model to choose the exact number needed for a complete procedure (up to 20), include relevant preparation, distinct actions, inspections, and final checks, and never pad/split steps to inflate the count. Preserve existing safety and uncertainty rules.
- [ ] **Step 4: Bound image creation and align image results.** Validate up to 20 text steps, call image generation only for the first 10, and return `null` for remaining indexes so guide/step ordering stays aligned. Cache the full aligned result.
- [ ] **Step 5: Update guide readiness logic.** When saving or repairing a public guide, consider only its first `min(step count, 10)` steps when deciding whether illustration work is complete. For existing illustrations after index 9, return them if already saved but do not generate new ones.

### Task 2: Update API routes and reader-facing guide views

**Files:**
- Modify: `src/app/api/illustrate/route.ts`
- Modify: `src/app/api/guides/[slug]/steps/[ordinal]/retry/route.ts`
- Modify: `src/components/guide-illustrations.tsx`
- Modify: `src/components/repair-request.tsx`
- Modify: `src/app/[locale]/guides/[slug]/page.tsx`
- Modify: `src/messages/en.json`
- Modify: `src/messages/fr.json`

**Interfaces:**
- Illustration API accepts up to 20 ordered text steps and returns equally aligned visuals, with no new generated visuals past step 10.
- Retry API allows illustration retries only for ordinals 1–10.

- [ ] **Step 1: Update route validation and errors.** Use the shared maximum for request validation; return a clear message that the guide may contain up to 20 written steps and only its first 10 can be illustrated. Reject retry ordinals above 10.
- [ ] **Step 2: Limit automatic guide illustrations to eligible steps.** In `GuideIllustrations`, send only the first 10 steps to the endpoint and observe for missing images only within those first 10. Preserve saved images and the full written list.
- [ ] **Step 3: Clarify text-only steps in both guide views.** For step 11 onward, render a localized “written instructions only; illustrations cover the first 10 steps” note instead of implying that an illustration is pending. Keep the written instruction prominent in both shared guide details and immediate generated results.
- [ ] **Step 4: Add matching English and French copy.** Add the text-only note under the appropriate `guideDetail` and `repair` message namespaces; preserve the existing messages for eligible steps whose images are still pending or failed.

### Task 3: Align the scheduled Cloudflare guide scout and documentation

**Files:**
- Modify: `workers/weekly-guide-scout.mjs`
- Modify: `docs/weekly-guide-scout.md`

**Interfaces:**
- Keep Worker-only limits as named constants: maximum 20 text steps, maximum 10 step illustrations, maximum 11 total generated images per run including the cover.
- Keep English and French arrays identical in step count and order.

- [ ] **Step 1: Expand scout schemas and sanitation.** Replace `maxSteps = 4` with a 20-step text ceiling and validate the matching French array. Update error text and both strict JSON schemas.
- [ ] **Step 2: Rewrite the scout's quality instruction.** Ask for the number of actions/checks a complete sourced repair requires, with no padding and no exact three-or-four rule. Keep the low-risk eligibility gate and source-grounding instructions intact.
- [ ] **Step 3: Illustrate only the first 10 steps.** Set an 11-image run maximum including the cover; persist every English and French written step; generate and attach step art only for indexes 0–9.
- [ ] **Step 4: Update operator documentation.** Explain the 20 text-step ceiling, first-10 illustration limit, and 11-image weekly budget including cover; keep the human-review-before-publish workflow unchanged.

### Task 4: Review and commit the approved change

**Files:**
- Include: the approved spec, this plan, and only the feature files listed above.

- [ ] **Step 1: Review the diff.** Confirm all generation/translation schemas accept up to 20 steps, all illustration paths are limited to the first 10, later written steps remain intact, and no unrelated analytics files are staged.
- [ ] **Step 2: Commit with the approved conventional style.** Use `git add` with explicit feature paths and `git commit -m "feat(guides): support detailed repair steps"`.
