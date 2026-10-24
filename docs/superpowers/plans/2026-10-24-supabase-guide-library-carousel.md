# Supabase guide library and homepage feature plan

> **For agentic workers:** Execute one task at a time. Keep changes in small, reviewable conventional commits.

**Goal:** Persist generated repair guides in Supabase, reuse existing guides, make the shared guide library searchable, fix dynamic detail routes, store step illustrations, and rotate repair examples on the homepage.

**Architecture:** The Node server is the only Supabase client and uses a server-only service-role key. Postgres stores guide metadata, steps, and optional part links. Supabase Storage stores generated illustrations. Static guides are seeded idempotently and remain available as local fallback. The browser talks to same-origin JSON endpoints and never receives database credentials.

**Tech Stack:** Existing Node HTTP server, Supabase JavaScript client, Postgres migration SQL, Supabase Storage, static HTML/CSS/ES modules.

**Spec:** `docs/superpowers/specs/2026-10-24-supabase-guide-library-carousel-design.md`

## Global constraints

- Never store uploaded source photos or raw descriptions. Public/reusable output must be generalized; photo-specific results and do-not-attempt cases stay unlisted.
- Keep generated guide content available if an illustration call fails. Persist successful images, mark missing ones, and let the visitor retry on demand.
- Keep service-role credentials server-only and enable RLS on every public table.
- Preserve current static routes and curated guides when Supabase is not configured.
- Do not expose unlisted guides in library search, homepage features, robots/sitemap, or reuse matching.
- Keep the existing design language and carousel behavior from the approved spec: three-second rotation, accessible controls, no autoplay with reduced motion.
- Avoid introducing an automated test suite. Build and inspect pages manually; use conventional commits.

---

### Task 1: Fix guide detail desktop layout and breadcrumb

**Files:** `scripts/build-site.mjs`, `guide-detail.css`, `templates/guide-detail.html`, `guide.html`

- [x] Give guide steps explicit number, image, and copy grid columns at desktop sizes; stack the image and instruction cleanly on narrow screens.
- [x] Replace the plain breadcrumb with an ordered, semantic trail, visible separators, active-page state, keyboard focus, and responsive wrapping.
- [x] Include the new stylesheet on both built detail pages and the legacy guide shell.
- [x] Rebuild the site and inspect `/guides/bike-flat/` at the reported desktop width (1,151 px).
- [x] Commit as `fix(guides): align repair steps and improve breadcrumb` (`86b6af0`).

### Task 2: Add Supabase schema, configuration, and curated guide seed

**Files:** `package.json`, `.env.example`, `supabase/migrations/`, `scripts/seed-guides.mjs`, `README.md`

- [x] Add the supported Supabase JavaScript client dependency.
- [x] Create `guides`, `guide_steps`, and `guide_parts` with status/visibility/safety checks, stable slug and match-key uniqueness, timestamps, ordinals, and indexed foreign keys.
- [x] Maintain a Postgres full-text vector with a trigger and add a GIN index. Enable RLS and reserve writes for server-side privileged access. Use a private illustration bucket with signed reads.
- [x] Add an idempotent seed script for all curated `site-data.js` guides, preserving IDs, steps, safety notes, tools, parts, and image paths.
- [x] Document `SUPABASE_URL`, server-only `SUPABASE_SERVICE_ROLE_KEY`, bucket name, migration, seed, and local static fallback. Do not add secret values.
- [x] Add lazy Supabase initialization in the server-only `guide-store.mjs` module so static site browsing still works without credentials.

### Task 3: Persist and reuse generated repair guides

**Files:** `server.mjs`, `guide-store.js`, `app.js`, `guide-ai.js`, `guide-page.js`

- [x] Extend the structured repair response with a conservative `generalizable` decision and omit identifying details from reusable output. Continue to discard the submitted source photo after analysis.
- [x] Add `POST /api/repair-guide`: analyze the issue, derive a deterministic key from normalized category and repair intent, return an existing public matching guide when present, otherwise insert against a unique key and return the row that wins a race.
- [x] Keep only generalized `safe_diy` guides public; save other results as unlisted safety guidance and omit hazardous step text for `do_not_attempt`.
- [x] Save the new guide before drawing. Generate step illustrations, upload successful images to Storage, persist their object paths and alt text, and set `published` or `needs_illustrations` as appropriate.
- [x] Return explicit persistence/reuse status so the UI never implies a result was saved when Supabase is unconfigured or unavailable. Continue to render the plan in one-time local mode when unconfigured.
- [x] Update homepage and library generation forms to use the combined endpoint and link saved public or unlisted guides appropriately.
- [x] Add an on-demand retry endpoint for missing illustrations that validates published guide/step, limits concurrent work, and rate-limits retries.

### Task 4: Serve dynamic detail pages and library search

**Files:** `server.mjs`, `scripts/build-site.mjs`, `guides.html`, `guide-library.js`, `guide-detail.css`, `sw.js`

- [x] Add `GET /api/guides` with text search over title, description, area, tools, and steps; retain All/Bike/Home/Clothes filters and six-item cursor pagination.
- [x] Add guide-by-slug lookup and render crawlable HTML for database-backed public guides using the existing detail-page template, dynamic canonical/social/HowTo metadata, and saved illustrations/parts.
- [x] Resolve `/guides/:slug/` before returning 404; retain the generated static page path for curated guides and produce a clear not-found response for unknown slugs.
- [x] Replace the guide library's hard-coded-only listing with the shared API plus static fallback and explicit loading/error/empty states. Keep unlisted guides out of listings and search.
- [x] Serve a dynamic sitemap that combines static and published Supabase guide paths; static sitemap remains a fallback if the database is unavailable.
- [x] Bump the service-worker cache version and include changed assets.

### Task 5: Rotate featured repairs on the homepage

**Files:** `index.html`, `server.mjs`, new `featured-carousel.js`, `presentation.css`, `sw.js`

- [x] Preserve Vitni as a fixed companion. Turn the existing repair feature card into a slide with image, category, title, outcome/step count, and a direct detail link.
- [x] Provide the four existing stories as first slides, then add eligible recent published guides from Supabase with fallback art where needed.
- [x] Advance every three seconds with a restrained transition; add labeled previous/next and pause/resume controls; pause on hover/focus or hidden-page state; disable autoplay under reduced motion and for one slide.
- [x] Keep keyboard focus in place and make announcements only for manual slide changes.
- [x] Update the service-worker cache list for the carousel script.

### Task 6: Build and review

- [x] Rebuild the static site and inspect guide layout, local API fallbacks, sitemap, and homepage carousel. Database-backed requests remain unverified until credentials are configured.
- [x] Confirm missing Supabase configuration leaves curated guides usable and reports generated plans as non-persistent.
- [x] Confirm no server key is copied into the browser distribution and generated-photo input is not written to persistence code.
- [ ] Apply the migration, seed the shared database, and verify a generated guide after Supabase credentials are supplied.
- [ ] Review the final diff, then commit Supabase work with a conventional message such as `feat(guides): persist repair guides in Supabase`.

## Environment note

The current local `.env` contains `OPENAI_API_KEY` only. The Supabase implementation can be completed with documented server-side placeholders, but shared persistence on vitni.cc remains disabled until the Supabase URL, service-role key, and storage bucket are configured.
