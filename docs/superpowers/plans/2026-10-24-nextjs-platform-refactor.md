# RepairLens Next.js platform refactor plan

This plan implements the approved design in place, preserving current URLs and the RepairLens brand. It assumes Node 22, pnpm, TypeScript, Next.js App Router, Tailwind v4, shadcn/ui, server-only OpenAI/Supabase access, and the existing safety/privacy rules.

## Phase 1 — Runtime and project foundation

1. Pin the compatible stable Next/React/TypeScript/Tailwind/shadcn toolchain and pnpm package manager.
2. Add Node 22 runtime hints and package engine range; add Next scripts for `dev`, `build`, `start`, lint, typecheck, and guide seeding.
3. Initialize App Router, TypeScript alias, Tailwind v4/PostCSS, ESLint, and shadcn configuration. Map RepairLens semantic colors, typography, borders, spacing, focus, and motion preferences into the shadcn/Tailwind theme.
4. Move static assets into `public/` without changing their browser URL paths. Keep PWA, Vitni, guide, story, sample photo, and OG files.
5. Add the Next root layout with fonts, metadata defaults, skip link, responsive header/menu, and footer.

## Phase 2 — Shared types and server services

1. Define typed guide/story/repair-assessment contracts and validate external request payloads.
2. Move curated site data into a TypeScript-compatible shared module that Next pages and the existing idempotent seed script can both read.
3. Move Supabase access behind a `server-only` TypeScript repository and keep the service-role key inaccessible to client modules.
4. Extract OpenAI analysis, repair-guide generation, illustration generation, safety normalization, matching/deduplication, and persistence orchestration into server-only modules.
5. Preserve request limits, error states, storage paths, signed URLs, retry caps, public/unlisted rules, and graceful local behavior with no Supabase configuration.

## Phase 3 — Next route handlers

1. Port current API endpoints to App Router route handlers with the Node.js runtime and existing response contracts.
2. Preserve guide search pagination, public guide lookup, featured repairs, repair analysis/generation, illustration generation, and per-step illustration retry.
3. Preserve `/sitemap.xml`, `/robots.txt`, `/llms.txt`, `/llms-full.txt`, the web manifest, icons, and legacy query URL redirects.
4. Confirm data and secrets are only accessed on the server; keep OpenAI and Supabase keys out of client output.

## Phase 4 — Public pages and client experiences

1. Convert the homepage, guide library at `/guides.html`, curated/database guide details, stories, and unlisted `/repairs/[token]/` page to server-rendered App Router pages.
2. Preserve current canonical paths and metadata, structured data, social images, breadcrumb semantics, and share links.
3. Rebuild client-only interactions as focused Client Components: menu, camera/file/dropzone, repair generation, live result/illustrations, carousel, guide search/filter/pagination, illustration retry, share, and DotLottie player.
4. Use shadcn primitives for accessible buttons, fields, cards, badges, pagination, and required overlays; compose with current branded layouts, not default template screens.
5. Implement responsive layouts using Tailwind utility classes and theme tokens. Retain only small CSS for necessary custom motion/illustration behavior; remove obsolete page CSS and vanilla DOM scripts after parity.
6. Preserve keyboard access, labels and live announcements, reduced-motion behavior, pause-on-focus/hover carousel behavior, and responsive use at mobile/tablet/desktop.

## Phase 5 — Cleanup and verification

1. Remove the custom Node server, static HTML build pipeline, duplicate page templates, and obsolete scripts/styles after their behavior is migrated.
2. Update README and `.env.example` for Node 22/pnpm, local and production commands, port `4174`, public URL, OpenAI, Supabase migration/seed, and server deployment.
3. Run `pnpm lint`, `pnpm typecheck`, and a production build.
4. Start Next locally and manually smoke-check the homepage, mobile/desktop layouts, photo generation fallback, guide library search/pagination, `/guides/seam/`, story pages, unlisted routes, legacy redirects, PWA assets, and discovery endpoints.
5. Review the diff for stale imports, missing assets, route drift, client/server boundary violations, and accidental secret exposure. Commit work in conventional commit scopes.

## Completion criteria

- All routes and behaviors in the approved design are served from Next.js; no old application server or static HTML generator remains in the runtime path.
- Node 22 and pnpm are explicit, reproducible project requirements with a checked-in pnpm lockfile.
- Tailwind v4 and shadcn/ui are used for the branded app rather than installed but unused.
- Lint, typecheck, and production build succeed. Manual route smoke checks pass where local configuration permits.
- README makes required external configuration (OpenAI and Supabase) clear without disclosing credentials.
