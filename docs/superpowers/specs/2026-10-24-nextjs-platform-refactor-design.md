# RepairLens Next.js platform refactor

## Intent

Move RepairLens from its hand-built static HTML generator and custom Node HTTP server to a maintainable, server-rendered Next.js application. The goal is to make the existing repair experience easier to extend and deploy while keeping the visual identity and the behaviors already built for the hackathon.

## Current state

- The home, guide library, guide details, and story details are rendered from HTML templates and a static build script.
- `server.mjs` serves generated files and implements OpenAI repair analysis/guide generation, illustration generation, guide storage, search, retries, and dynamic detail routes.
- `guide-store.mjs` accesses Supabase with a server-side service-role key. The existing guide schema and storage migration are already checked in.
- Browser behavior lives in separate JavaScript files. Static images, Lottie JSON, the PWA manifest, service worker, and SEO/share assets live at the repository root.
- The project currently uses npm and has no framework, TypeScript, Tailwind, or shadcn setup.

## Goals

- Make Next.js App Router the single application and server entry point.
- Set Node 22 as the supported runtime and pnpm as the package manager with a committed lockfile.
- Use TypeScript for application pages, components, services, and API contracts.
- Adopt Tailwind CSS v4 and shadcn/ui as the component foundation, themed to RepairLens' existing palette, typography, spacing, and ligne claire Vitni artwork.
- Preserve current page URLs, core behaviors, public guide/story content, SEO and agent-discovery files, share links, responsive behavior, accessibility work, and PWA assets.
- Keep Supabase and OpenAI secrets on the server. Preserve saved-guide deduplication, persistent images and guide steps, search, and illustration retry behavior.
- Provide a clear local development, production build/start, typecheck/lint, and guide-seed workflow using pnpm.

## Non-goals

- No product feature expansion, account system, billing, or new database schema as part of the framework migration.
- No change to repair instructions or safety classifications.
- No redesign away from the established RepairLens brand and Vitni character.
- No static-only deployment. OpenAI and Supabase features require a Node server runtime.
- No new test suite in this refactor unless the user asks for one; verify with build, typecheck, lint, and focused manual smoke checks.

## Anti-goals

- Do not expose `OPENAI_API_KEY` or `SUPABASE_SERVICE_ROLE_KEY` to client bundles, HTML, or public API responses.
- Do not leave two active implementations (the old site and a new Next app) after migration.
- Do not replace the visual system with default unthemed shadcn examples or add dependencies without an application need.
- Do not break old `/guide.html?guide=...`, `/story.html?story=...`, saved guide, canonical, or social-share URLs.

## Approaches considered

1. **Convert the repository in place to Next.js App Router — chosen.** Move page rendering into server components and APIs into route handlers, while retaining the same public route patterns and translating the existing brand into Tailwind tokens and shadcn components. This gives the AI and Supabase features one supported Node runtime and avoids duplicated applications.
2. **Add a parallel Next.js app in a subdirectory.** This could stage migration gradually, but would duplicate the page, asset, and data sources and make it unclear which app is authoritative. It is a poor fit for the request to refactor the whole project.
3. **Keep the static generator and add Next only for selected screens.** This preserves the old server but leaves two routing and rendering systems; static-only output also cannot serve database-backed generated guides. This does not simplify the project enough to meet the request.

The user selected the in-place migration and keeping the RepairLens brand, using the modern stack to rebuild the presentation rather than switching to stock shadcn styling.

## Product and route behavior

Keep these routes resolvable and crawlable:

- `/` for the homepage and its photo/description repair flow.
- `/guides.html` for the existing guide-library URL, with its search, area filters, and pagination.
- `/guides/[slug]/` for curated and saved public guide details, including `/guides/seam/`.
- `/stories/[slug]/` for the existing repair success-story detail pages.
- `/repairs/[token]/` for unlisted, photo-specific repair links.
- `/guide.html?guide=...` and `/story.html?story=...` as permanent redirects to their established pretty URLs.
- Existing API contracts for guide search/details, featured repairs, repair generation, analysis, illustration generation, and step-illustration retry.
- `/sitemap.xml`, `/robots.txt`, `/llms.txt`, `/llms-full.txt`, manifest, icons, and social preview assets.

Server-render public guide/story pages for search crawlers. Preserve useful page metadata and structured data, and keep published database guides in the guide-library/search flow. Use Next metadata/metadata routes for canonical, Open Graph, Twitter, sitemap, robots, and discovery files where applicable. Do not switch the current canonical guide-library URL during this refactor.

## Architecture and implementation calls

- Use the Next.js App Router, React Server Components for public/read-only pages, and narrowly scoped Client Components for menus, photo upload, generation feedback, filters/pagination, carousel controls, sharing, and Lottie playback.
- Use TypeScript and a single `@/*` source alias. Keep route/API contracts explicitly typed and validate untrusted request bodies before passing data to OpenAI or Supabase.
- Target Node `22.x` using a `.nvmrc` (and/or equivalent runtime hint), `engines` in `package.json`, and a pinned pnpm version in the `packageManager` field. Keep both development and production on the Node runtime; do not use Edge runtime for code requiring the Supabase SDK, image buffers, or private credentials.
- Adopt Tailwind v4 with the official Next PostCSS integration. Define semantic design tokens in the global stylesheet and wire them to shadcn's theme variables. Use shadcn/ui primitives where they improve consistency and accessibility (buttons, fields, cards, badges, pagination, dialogs/sheets as needed); compose them with the existing RepairLens layouts rather than forcing a generic dashboard pattern.
- Keep a small, purposeful client dependency set: the existing DotLottie player, Supabase JS SDK, Lucide icons, shadcn's generated primitive/utilities, and Zod for shared API validation. Retain native `fetch` for OpenAI unless a concrete SDK feature is needed. Avoid adding animation, form, server-state, or database client libraries without a demonstrated requirement.
- Put static media under `public/` while retaining URL paths such as `/images/...` and `/animations/...`. Preserve `sw.js`, `manifest.webmanifest`, the Vitni head icon, full mascot art, generated guide/story images, sample photo, and OG image. Load Lottie only where used and honor reduced-motion preferences.
- Move domain behavior out of `server.mjs` into server-only modules for OpenAI, guide persistence, and guide rendering/data adaptation. Keep the Supabase service-role client in a server-only module and use the existing migration/schema, not a browser Supabase client.
- Implement the current API paths as Next Route Handlers. Preserve request limits, input and image type checks, throttling, safety redaction, duplicate matching, retry limits, signed illustration URLs, and graceful local operation without Supabase.
- Convert the existing home, guide library/detail, story detail, and unlisted repair templates to Next page/layout components. Keep local curated guide data and the idempotent seed script usable; move or adapt `site-data.js` only as needed so both Next and the seed script can consume it reliably.
- Replace `npm` scripts with a pnpm workflow for `dev`, `build`, `start`, `lint`, `typecheck`, and `seed:guides`. Pin compatible stable dependency versions in `package.json` and `pnpm-lock.yaml`. Document Node 22, pnpm/Corepack, environment variables, and the required server deployment in the README.

## Constraints

- The user wants the current RepairLens look retained, with shadcn used as a component system and Tailwind as the styling system.
- The production origin is `https://vitni.cc`; local dev currently uses port `4174` and should continue to do so unless Next's configured `PORT` is supplied.
- Supabase is the shared data store. Existing migration and seed data must remain reproducible; no Supabase credentials are available as tracked files and secrets must remain external.
- Existing public paths, already shared links, generated guide rows, guide image paths, and PWA installation behavior must continue to work after deployment.
- Use official current Next, Tailwind, and shadcn guidance when selecting versions and setup commands. Node 22 is explicitly requested even if a newer Node version is installed locally.

## Acceptance criteria

1. `pnpm dev` starts the Next application on the existing local port by default, and `pnpm build && pnpm start` serves it as a production Node application.
2. Homepage, guide library, each existing curated guide, story detail, unlisted guide, legacy redirect, manifest, service worker, and discovery routes resolve without 404s.
3. Public pages render meaningful HTML and correct canonical, Open Graph, Twitter, structured-data, and title/description metadata without requiring client JavaScript.
4. The current photo/description interaction continues to produce safe repair guidance and generated illustrations. A configured Supabase environment persists/reuses searchable guides and their step images; unconfigured local mode explains when a result cannot be saved.
5. Existing search, filters, pagination, featured repairs, illustration retry, share fallback, keyboard behavior, responsive layouts, and reduced-motion handling still function.
6. Node/Next client bundles and rendered page source contain no OpenAI or Supabase service-role credentials. Supabase writes remain server-side and existing RLS/storage boundaries remain intact.
7. `pnpm lint`, `pnpm typecheck`, and `pnpm build` pass, and the README documents the setup, environment, database, seed, and deployment workflow.

## Builder decisions

- Choose the smallest current stable versions compatible with Node 22 and pin them through the lockfile; record the exact pnpm release.
- Preserve the current port `4174` using the normal `PORT` environment setting, without adding a second custom server.
- Reuse the existing styles selectively as a visual reference, but complete the conversion to the Tailwind/shadcn layer rather than keeping a parallel legacy CSS system.
- Where image URLs are signed or database-driven, preserve their current URL behavior and avoid introducing a Next image-optimization configuration that breaks private storage images.
- Keep external provider failures explicit and recoverable; do not pretend guides were saved when persistence is unavailable.

## Approval

The user approved the in-place Next.js migration and preserving the RepairLens visual identity on 2026-10-24. This design is presented for final approval before the implementation plan and code changes.
