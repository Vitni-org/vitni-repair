# Vitni Multilingual Website and Repair Guides

## Intent

Make Vitni usable in English and French across the website, repair library, and photo-or-description guide generation. Choose the first-visit language from the browser when supported, let visitors switch languages, and use English whenever French content is not available.

## Current state

- The site is a Next 16 App Router application built and deployed to Cloudflare with Vinext.
- Public routes, page metadata, forms, safety copy, and guide components are English-only.
- Repair generation accepts no locale and writes generated English content to `guides`, `guide_steps`, and `guide_parts`.
- Guide matching uses an English-looking title-derived key, but does not define a canonical language or return localized guide views.
- There are 33 bundled guides and 4 illustrative stories to localize. The Supabase migrations are in the repository, but the live project has not applied them; the latest check found the partner table absent. Local credentials do not include a database connection or Supabase CLI session.
- Vinext supports the Next proxy/middleware routing needed for locale negotiation.

## Goals

- Support `en` and `fr` now through a locale registry that can accept more languages later.
- Keep current English URLs unchanged. Use `/fr/...` for French pages and guides.
- On a first visit, choose a supported locale from the browser preference. An explicit path or saved language choice takes precedence. Show an accessible language switcher and persist the choice.
- Localize visitor-facing page copy, navigation, forms, accessibility labels, safety guidance, community and partner pages, stories, guide search/cards/details, PWA prompts, page metadata, and structured data.
- Translate all 33 bundled guides and 4 illustrative stories into French; preserve English as the fallback for unavailable content.
- Pass the selected locale to guide generation. Return and save the guide in that locale, while preserving an English canonical guide representation for safe fallback and cross-language duplicate detection.
- Reuse existing illustrations and purchase URLs across translations. Translate alt text and human-readable part details without changing links or compatibility claims.
- Make French library search use French guide text, with a database index for stored translations.
- Add canonical URLs and `hreflang` alternates for English and French pages, and include both locales in the sitemap.
- Keep existing API paths and identifiers stable; API payloads may gain an optional locale field defaulting to `en`.

## Non-goals

- Adding a third language in this release.
- Publishing user descriptions, photos, unlisted guides, or their translations into the public guide library without the existing sharing choice.
- Localizing retailer inventory or asserting that translated parts are compatible or available.
- Rebranding internal storage names or introducing region-specific variants such as `fr-CA`.

## Approaches considered

1. **Locale paths with saved guide localizations (selected).** English remains at existing URLs and French uses `/fr/`. A supported i18n library handles message dictionaries, locale-aware navigation, metadata, and browser preference. Store translations alongside the canonical guide and search translated fields. This supports shareable, crawlable language variants and accurate fallback behavior, with a routing and migration refactor.
2. **Cookie or query-only locale.** Keep one path and select language from a cookie or `?lang=fr`. This reduces route changes but makes translated links, canonical metadata, and indexing less clear.
3. **Translate new generations only.** Generate the result in the selected language and leave the current library in English. This is smaller but does not meet the request to localize the website and existing guides.

The user chose the first approach and English plus French as the initial languages.

## Design decisions

### Routing and interface messages

- Use `next-intl` with an English default locale, optional locale prefix (`/fr` only for French), and proxy-based locale negotiation. Exclude API routes, Next assets, public files, service worker, and machine-readable endpoints that need explicit handling from page negotiation.
- Move visitor-facing pages under the locale segment while keeping `/api/*` routes stable.
- Put shared labels and page copy in typed English and French message catalogs. Server and client components use the same locale-aware message API.
- The selected locale controls `<html lang>`. If a specific guide falls back to English, mark that guide content with `lang="en"` so assistive technology reads it correctly.
- Keep share URLs in the active locale. The language switcher maps equivalent routes when a French counterpart exists and otherwise points to the default-language equivalent.

### Guide content, translation, and generation

- Treat English as the canonical stored representation. Extend structured model output with a stable English canonical issue for matching; user-facing fields are translated to the requested locale with a schema-validated text-only translation step.
- Reuse a guide across languages only on an exact normalized `area + canonical English issue` match. Do not fuzzy-merge similar symptoms or repair paths; that could return unsafe or incompatible instructions.
- Keep one canonical guide per normalized repair issue. Add `guide_localizations` keyed by `(guide_id, locale)` for localized title, description, safety notes, tools, steps, parts, alt text, and searchable text. Reuse canonical image paths and purchase URLs.
- Cache successful French translations. A detail request uses a cached translation, creates and saves one if missing, and falls back to English if translation or persistence is unavailable. Do not change safety level, repair steps, dimensions, compatibility requirements, product identifiers, or URLs during translation.
- Localize bundled guides and illustrative stories as checked-in French content so the first French library page does not need a burst of model requests; review these translations for correctness before release. Database-backed guides use the localization table and translated search index.
- Private generated translations may be returned automatically after schema and safety-invariant validation. They become public only through the existing explicit sharing choice; no additional human approval step is added to the private repair flow.
- Accept optional `locale` on `/api/repair-guide`, `/api/analyze`, and relevant guide search/detail endpoints; validate against supported locales and default absent or unsupported values to English.
- Keep user photos and descriptions in the assessment flow only. The translation step receives only the validated guide fields, not the original photo or raw user description.

### Database and rollout

- Add a migration for the localization table, indexes, constraints, and service-role-only RLS access. Existing guide rows remain canonical English without rewriting their images or public URLs.
- Deploy application code with English fallback so a missing or not-yet-applied localization migration does not break existing pages. French dynamic database translations require applying the migration first.
- The current workspace has no database URL, database password, Supabase access token, or linked Supabase CLI session. Migration execution is therefore an external rollout prerequisite; the code and SQL migration can still be prepared in this task.

### Search, SEO, and accessibility

- Search translated titles, descriptions, steps, tools, and parts for French results; preserve current English filtering and pagination behavior.
- Generate localized title/description metadata, Open Graph values, JSON-LD names/instructions, canonical links, and reciprocal `hreflang` tags.
- Add language names to the switcher in their native form, maintain visible focus, and announce language changes where client-side navigation is used.

## Risks and mitigations

- A model could alter a safety instruction while translating. Validate the output shape, preserve the canonical safety classification and URLs, and use English fallback if validation fails.
- French translations will not be visible for dynamic database guides until the migration is applied. Keep existing English pages available and clearly identify the migration prerequisite.
- Locale routing can affect static metadata files and PWA assets. Add explicit handling for sitemap, robots, manifest, service worker, `llms.txt`, and assets during implementation.
- Automatic browser negotiation can surprise returning users. Persist an explicit switcher choice and always honor an explicit `/fr/` path.

## Acceptance criteria

- English visitors keep the current URLs and see English by default; French browser preferences reach French pages on first visit; a manual choice persists.
- Unsupported browser languages resolve to English.
- French UI, current bundled guides, and illustrative stories are French; missing translations render English safely.
- New guide generation returns instructions and labels in the selected language, saves a canonical representation plus localization, and reuses an existing guide across locales when the canonical issue matches.
- French guide-library search, guide details, and their metadata are localized; English behavior and routes remain intact.
- API paths remain stable and omitted locale continues to work as English.
- A missing localization table or failed translation does not turn a working English guide into a 5xx response.
- Sitemap and language alternates expose localized pages correctly.
