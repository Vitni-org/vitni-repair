# Vitni Multilingual Implementation Plan

This plan follows the approved design at `docs/superpowers/specs/2026-10-26-vitni-multilingual-design.md`. English remains the canonical language and keeps current URLs; French uses `/fr/`. APIs remain at `/api/*`.

## Phase 1: Locale foundation

1. Add `next-intl` and configure supported locales `en` and `fr`, default locale `en`, and `localePrefix: "as-needed"`.
2. Add routing, request configuration, typed locale-aware navigation, message catalogs, and a Next proxy that negotiates the first visit from `Accept-Language` and persists explicit choices in `NEXT_LOCALE`.
3. Exclude API handlers, Next internals, public assets, service worker, and metadata endpoints from locale rewrites; explicitly localize sitemap and language metadata.
4. Move visitor-facing routes below `src/app/[locale]/`; retain `src/app/api/*` and truly global endpoints at stable paths.
5. Move the root layout into the locale layout, validate the locale parameter, load the locale messages, set `<html lang>`, and keep global analytics, PWA registration, fonts, styles, header, and footer in one layout.

## Phase 2: Visitor-facing translations

1. Inventory every English UI string in home, header/footer, repair request/results, guide library, detail/sector routes, stories, partner page/form, repair safety, unlisted repair page, PWA installation, and feedback controls.
2. Add matching English and French message keys; route visible text, validation, loading/error states, accessible names, analytics labels that reach the UI, metadata, and structured data through locale messages.
3. Add an accessible language switcher that preserves the equivalent path, search, and pagination when a matching page exists and otherwise points to that guide’s English page.
4. Localize PWA prompt text and app metadata; keep service worker, API, asset, and install paths stable.

## Phase 3: Bundled guide and story catalog

1. Add reviewed French entries for all 33 bundled guides and 4 illustrative stories, keyed by stable existing IDs.
2. Extend `RepairGuide` and story view helpers to return localized text with English fallback while preserving stable category codes, image URLs, product links, and safety classification.
3. Pass locale into featured cards, guide search, guide detail metadata, breadcrumb labels, safety labels, step headings, and JSON-LD.

## Phase 4: Persistent generated-guide localization

1. Add a Supabase migration for `guide_localizations` with `(guide_id, locale)` primary key, localized structured fields, translated search text/vector, RLS, and service-role-only access.
2. Extend `guide-store.mjs` with functions to fetch/upsert localizations and search localized guide content; make missing localization schema a safe English fallback.
3. Add locale to repair request validation and client payloads. Keep assessment and guide safety schemas strict.
4. Generate canonical English guide content plus a stable English issue identifier. For French output, translate only validated structured guide fields with a strict schema; do not resend the original photo or raw description to the translation step.
5. Match exact normalized `area + canonical English issue` keys across locales. Reuse canonical images and purchase URLs; persist translated text separately.
6. Add on-demand translation and caching for English database-backed guides viewed in French. Validate translation invariants and fall back to English if translation or storage fails.
7. Localize guide search parameters and query the translation index for French, falling back to canonical English results when no translation is available.

## Phase 5: SEO, accessibility, and integration

1. Add canonical and reciprocal `hreflang` metadata for English and French routes; localize titles, descriptions, Open Graph, Twitter, breadcrumbs, HowTo/Article JSON-LD, and sitemap entries.
2. Keep robots and static endpoints stable, and ensure they expose the intended locale URLs without redirecting crawlers unexpectedly.
3. Verify language switcher keyboard use, visible focus, localized screen-reader labels, locale-correct `<html lang>`, and `lang="en"` on fallback content inside French pages.
4. Run formatting/type checks and a production build. Smoke-check `/`, `/fr/`, guide library/detail routes, `/api/repair-guide` with and without locale, sitemap alternates, and English fallback when translations are unavailable.
5. Deploy to Cloudflare only after the application build is sound. Include the Supabase localization migration in the rollout checklist; remote French persistence requires applying it with an authenticated database connection.

## Rollout constraints

- The workspace currently has no database URL/password or authenticated Supabase CLI session. The migration can be prepared, but it cannot be applied to the live database from the current credentials.
- Until that migration is applied, English pages and bundled French content remain available; dynamic stored guides use English fallback if localization storage is missing.
- Do not expose or print any API credentials during locale or translation work.
