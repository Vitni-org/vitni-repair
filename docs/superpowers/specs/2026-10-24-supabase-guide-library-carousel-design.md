# Supabase guide library and featured repair carousel

## Intent

Make RepairLens guides persistent and reusable. When someone requests a repair plan, RepairLens should reuse a matching published guide when one exists, or generate and save a new guide with its steps and illustrations. The guide library should list and search the shared catalogue on vitni.cc. Repair detail URLs must resolve reliably. On the homepage, make the existing success-story card more lively by rotating through repair examples while Vitni remains visible.

## Current state

- The site is a small Node server with a build step that emits static guide and story pages. The guide library imports a hard-coded array from `site-data.js` and paginates six cards at a time.
- `/api/analyze` creates repair plans with OpenAI. `/api/illustrate` creates step drawings and returns data URIs. Those drawings are not persisted. The server has no database dependency or Supabase configuration.
- The homepage features one fixed bike repair story alongside Vitni. Existing stories cover a bike chain, denim, a lamp, and a window.
- Static SEO pages and the sitemap are generated at build time, so generated database guides also need a crawlable route and sitemap strategy.

## Goals

- Use Supabase as the shared source for generated guides on vitni.cc.
- Reuse an existing matching guide before spending time or image-generation cost; avoid duplicate inserts when two requests race.
- Save guide content, illustrated step assets, optional parts links, and enough status metadata to recover from partial generation. Keep video as a nullable future extension; video generation is not part of this work.
- Search and browse saved guides from the library page with category filters, pagination, and useful empty/loading/error states.
- Resolve guide detail pages by slug, including `/guides/seam/`, and include saved guides in crawlable metadata and sitemap output.
- Rotate the homepage featured repair card among existing success stories and published guides every three seconds. Keep Vitni fixed beside it.
- Keep the carousel usable with keyboard and touch, expose manual previous/next controls and a pause/resume control, pause while focused or hovered, and disable autoplay for reduced-motion preferences.
- Follow existing RepairLens visual language and preserve the current six-card guide library presentation.

## Non-goals

- Retaining users' uploaded problem photos. Store only guide output and generated illustrations in this scope.
- Generating repair videos, payments, user accounts, private guides, community moderation, or a full CMS.
- Reworking all curated guide content or redesigning the library.
- Exposing a Supabase service-role key or other privileged credentials in browser code.

## Approaches considered

1. **Supabase-backed shared catalogue (chosen):** persist generated guides and illustration files in Supabase, with the Node server as the trusted API boundary. This matches the user’s choice and makes saved guides available across devices and visitors. It adds hosted configuration, schema, RLS, and storage setup.
2. **SQLite on the web host:** less setup and a good local prototype, but the library would be tied to one server’s disk and deployment lifecycle. It does not fit the requested shared database on vitni.cc.
3. **Keep static content only:** avoids infrastructure, but generated plans cannot be reused, searched, or reliably linked. It does not meet the request.

## Product behavior

### Requesting and reusing a guide

1. The visitor sends a description and optional photo through the existing repair form.
2. The server normalizes the description and derives a stable matching key from the repair topic, item/category when available, and normalized repair intent. Matching should avoid treating small wording changes as wholly new guides; exact and normalized-title/intent matches are appropriate first-release rules. Do not claim broad semantic matching unless an embedding/search service is added.
3. If a published matching guide exists, return it with its saved step illustrations and optional parts links. The generated guide page is linked by its stable slug.
4. Otherwise, generate structured steps, safety notes, tools, and optional part queries/links. Persist the guide before illustrating so the content is recoverable if image generation fails.
5. Generate one illustration per step, upload each successful image to Supabase Storage, and save its storage path and alt text on the step. Show a clear placeholder and retry path for any missing image. Do not store image data URIs in Postgres.
6. Use a unique constraint plus atomic upsert/insert conflict handling on the matching key so concurrent requests cannot create duplicate guides. If another request wins the race, return the existing saved record.
7. Preserve generation status (`draft`, `published`, or `needs_illustrations`) and visibility (`public` or `unlisted`). A guide is searchable and featured only once its repair content is valid; missing illustrations do not make the guide inaccessible.
8. Keep uploaded source photos and raw user descriptions out of persistent storage. Public guide content must be generalized: omit identifying details and observations that apply only to one photographed object. If the result cannot be generalized reliably, save it as an unlisted guide with an opaque share token; it is accessible by the returned link, but not in search, sitemap, carousel, or cross-user reuse. The browser can remember the link locally. Do not retain the source photo.

### Safety publication rules

- Store the model's safety classification with every saved guide.
- A `safe_diy` plan can be public after schema and content validation.
- A `get_help` plan can be public only when its steps are limited to safe observation, shutdown/isolation when appropriate, preparation, and getting qualified or community help. It must not present hazardous disassembly as DIY.
- A `do_not_attempt` result can be saved as an unlisted safety triage page with clear stop/referral advice. Do not include it in general search, reuse matching, or homepage features. If safe next steps cannot be separated from hazardous instructions, persist only the safety summary and referral, not the unsafe step text.
- Safety classification is not a guarantee. The UI must prominently show the stop/referral state and never present AI illustrations as authoritative technical specifications.

### Guide library and detail pages

- The library queries published records from the Node API, supports text search and existing Bike/Home/Clothes/All filters, and paginates results. Search should cover title, description, area, tools, and repair steps. Use PostgreSQL full-text search with a GIN index; use stable cursor pagination for the shared listing rather than loading the entire catalogue into the browser.
- The curated guides should remain available. Seed or migrate the existing curated `site-data.js` content into Supabase in an idempotent way, retaining stable IDs/slugs and current images, steps, safety notes, tools, and parts. The server may use curated static data as a fallback if Supabase is not configured locally; production database failure should display a recoverable library error, not silently imply that the catalogue is complete.
- Detail route `/guides/:slug/` should read the guide by slug and render a canonical page, including saved step illustrations, safety notes, tools, optional part links, and share metadata. Existing statically generated pages can remain as build-time SEO fallbacks, while generated guides are served through a server-rendered or otherwise crawlable HTML route. Route resolution must not require a file literally named after the slug.
- The sitemap should combine static routes with published Supabase guide slugs at runtime or a deployment/build export step. If DB access is temporarily unavailable, retain static sitemap entries and report the limitation through server logs.

### Data and storage outline

- `guides`: identity primary key; unique stable `slug`; unique `match_key` for eligible public reusable guides; a separate opaque share token for unlisted requests; title, description, area, difficulty, estimated time, safety classification/notes, tool list, source (`curated` or `generated`), generation status, visibility, timestamps, and a full-text search vector. Use appropriate Postgres types and checks for status/category/visibility.
- `guide_steps`: identity primary key; `guide_id` foreign key with cascade delete; ordinal; title; instruction; illustration storage path; illustration alt text; optional illustration status. Enforce unique `(guide_id, ordinal)` and index the foreign key.
- `guide_parts`: identity primary key; `guide_id` foreign key; name/query, optional retailer, URL, and optional sizing/context notes. Only store links that are actually available; links are not required for a valid guide.
- Optional future video output can attach to a step through nullable storage path and status fields, or a dedicated media table if multiple media variants become necessary. In this scope, no video is generated or exposed.
- Store generated illustration binaries in a private or appropriately public Supabase Storage bucket and store stable object paths in Postgres. The implementation must define whether to serve through signed URLs or a public read-only bucket; prefer the narrowest access compatible with public published guides.

### Security, privacy, and operations

- Enable RLS on every table. Public browser clients receive no write privileges and do not call Supabase directly. The Node server uses server-only Supabase credentials; service-role secrets never enter HTML, scripts, source control, or API responses.
- Public API returns only published guide fields and validated, safe links. All writes and publication-state changes go through the server. Add request-size/type validation and basic abuse/rate limits to anonymous generation endpoints.
- Do not persist uploaded source photos, prompts containing unnecessary personal information, or API secrets. Avoid logging full descriptions or photo data. Remove temporary image data from memory after upload where practical.
- Unlisted guide tokens must be cryptographically random, excluded from sitemap and search, and returned only to the requesting client. They are bearer links, not account-based access control; say so in user-facing copy if the link is shareable.
- Add an SQL migration and an idempotent seed command. Configuration should document `SUPABASE_URL`, server-side key, and storage bucket. Missing credentials should leave local development usable with curated static content and clearly disable persistence.

## Homepage featured carousel

- Replace the single static featured repair card with a two-column feature stage: a rotating photo/card on one side and the established Vitni mascot area on the other. Maintain the visual balance and width from the supplied desktop reference, with a responsive stacked layout on smaller screens.
- Use existing bike-chain, denim, lamp, and window stories as initial slides, then include recent published database guides when available. Each slide has image, category, title, short outcome/step count, and a link to its detail page. Use safe fallback art for records without a cover image.
- Advance every three seconds, with a restrained crossfade/slide. Keep controls visible and labeled. Pause while the carousel is hovered or contains keyboard focus; pause automatically under `prefers-reduced-motion`. Manual navigation can resume rotation according to conventional carousel behavior. Do not move keyboard focus or announce every timed slide to screen readers; announce manually selected slide changes politely. Provide a pause control with an accessible name and state.
- If fewer than two items are available, show a static feature rather than animating an empty/single-item carousel. Respect page visibility so a hidden tab does not continue rotating.

## Failure cases and recovery

- Supabase unavailable: curated pages remain accessible; library reports that saved guides could not be loaded; guide generation can return an explicit temporary failure rather than claiming persistence.
- OpenAI analysis fails: do not create a published guide; show a retry message.
- One or more illustration calls fail: retain the structured guide, save successful assets, mark missing steps, and let the page render with placeholders and a retry action.
- Illustration retry: any visitor can request a retry for a missing published guide step; the server validates guide and step status, limits concurrent work, and applies per-guide/step rate limits. Retries run on demand through the existing synchronous Node endpoint in this release; no background job queue is required. Unlisted plans do not expose retries to other visitors.
- Storage upload fails: keep the step text, mark illustration as missing, and do not persist temporary data URIs as a workaround.
- Duplicate match or concurrent insert: return the row that won the unique-key conflict.
- Invalid or stale purchase URLs: validate URL schemes and escape output; omit a part link that fails validation.

## Acceptance signals

- A successful generated guide appears on its detail route after refresh and on a second browser/device through the shared library.
- Asking for the same normalized repair returns the saved guide and does not create a duplicate record or repeat image generation.
- Each saved step illustration loads from persistent storage; missing images have an understandable placeholder and retry state.
- Search, category filters, and pagination operate on the shared published catalogue.
- `/guides/seam/` and other valid guide slugs return a real detail page rather than a 404.
- The homepage rotates among valid stories/guides at the intended cadence, provides working manual controls, and does not autoplay for reduced-motion users.
- Supabase credentials are server-only; RLS prevents public writes; curated static pages remain usable when local Supabase configuration is absent.

## Calls left to implementation

- Choose the Supabase client library and runtime connection pattern after checking Node version and deployment constraints; use Supabase's supported server-side API unless a direct pooled Postgres connection is demonstrably needed.
- Choose whether published media uses public bucket URLs or signed URLs, documenting cache behavior.
- Define safe matching normalization and a minimum threshold for treating an existing guide as the same repair; keep the first release deterministic and inspectable.
- Select exact carousel transitions and database query limits while honoring the behavior and accessibility requirements above.

## Approval

Supabase was selected by the user for the shared vitni.cc database. The user asked to proceed on 2026-10-24. Proceed with the privacy default described above: discard source photos, publish generalized repair guides, and keep photo-specific plans unlisted behind opaque links. The homepage carousel uses the user's suggested three-second cadence.
