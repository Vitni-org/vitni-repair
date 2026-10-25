# Vitni public brand design

## Intent

Make **Vitni** the product name visitors see throughout the RepairLens website and installed PWA. Vitni is already the repair sidekick and mascot; using the same name for the product makes the identity clearer and more memorable.

## Goals

- Replace the public-facing RepairLens name with Vitni across site navigation, footer, page titles, metadata, social previews, the PWA manifest, machine-readable site descriptions, and visible assistant language.
- Refresh the Open Graph artwork so shared links say Vitni and continue to feature the existing Vitni character.
- Preserve existing routes and `vitni.cc` canonicals so current links and search indexing remain valid.
- Preserve local analytics-consent storage, service-worker caches, database/schema names, API routes, and filenames to avoid data or offline-cache migration.

## Non-goals

- Changing the domain, guide URLs, API contract, database names, cache names, local-storage keys, or GA4 event names.
- Reworking the visual identity, mascot design, or page layouts beyond adapting the existing brand lockup and social artwork to the new name.
- Rewriting historical implementation/design documents that accurately describe the former RepairLens name.

## Approaches

1. **Public brand only (selected):** Update visitor-facing copy and names, metadata, PWA identity, agent-facing site description, and OG artwork. Keep technical identifiers and current URLs stable. This gives the product a consistent Vitni identity without invalidating existing user state or links.
2. **Full internal rename:** Also rename storage keys, caches, database/service identifiers, and filenames. This adds migration and compatibility work, while offering little value to visitors and risking lost consent or offline data.
3. **Co-brand:** Keep “RepairLens” as the product and label Vitni as its assistant. This preserves the original brand but does not fulfill the requested rename.

The selected scope is approach 1, confirmed by the user on 2026-10-25.

## User-facing surfaces

- Header brand text and accessible home label; footer brand and end mark; not-found and other page copy.
- Root and route metadata, Open Graph/Twitter site name and titles, and public machine-readable descriptions (`llms.txt`, `llms-full.txt`, README product overview).
- PWA manifest name and short name, with the existing Vitni icon retained.
- Open Graph vector and 1200×630 PNG artwork, keeping the current palette, composition, character, and canonical image URL.
- The assistant's user-visible system identity and any public error copy that currently names RepairLens.

## Builder decisions

- Use concise “Vitni” page titles and the existing tagline **Keep good things going** where a descriptive title is needed.
- Preserve canonical and sitemap URLs on `https://vitni.cc`.
- Keep the old social image filename and icon asset paths so metadata consumers and caches do not encounter broken references.
- After export, verify the PNG dimensions remain 1200×630 and inspect the image before committing.

## Acceptance criteria

- No current visitor-facing app content, metadata, PWA label, or share image presents RepairLens as the product name.
- Historical design/implementation records and technical identifiers may retain `repairlens`.
- Existing route URLs, consent preference, offline cache, and Supabase data identifiers remain unchanged.
- TypeScript and lint pass; `git diff --check` is clean. No automated tests are added or run unless requested.
