# RepairLens

RepairLens is a responsive, installable repair guide app. Vitni helps people understand everyday repairs, follow illustrated steps, and find community support when a job needs an extra hand.

## Stack

- Node.js 22
- pnpm 12
- Next.js App Router and React 19
- Tailwind CSS 4
- shadcn/ui components built on Base UI
- Supabase Postgres and Storage for the shared generated guide library
- OpenAI Responses API for repair assessment and image generation

## Run locally

```bash
nvm use
corepack enable
pnpm install
pnpm dev
```

Open [http://localhost:4174](http://localhost:4174). The app works with curated guides without external credentials. Copy `.env.example` to `.env.local` for AI generation and shared guide storage.

## Environment

```dotenv
OPENAI_API_KEY=
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
PUBLIC_SITE_URL=https://vitni.cc
NEXT_PUBLIC_GA_MEASUREMENT_ID=
```

Keep `OPENAI_API_KEY` and `SUPABASE_SERVICE_ROLE_KEY` server-side. Do not use a `NEXT_PUBLIC_` prefix for either secret. `PUBLIC_SITE_URL` sets canonical URLs, sitemap and agent discovery links, and metadata origins.

## Google Analytics 4

To enable optional usage analytics, create or choose a GA4 web data stream and put its `G-...` Measurement ID in `NEXT_PUBLIC_GA_MEASUREMENT_ID` in `.env.local` and your deployment environment, then restart or redeploy. With the variable unset or invalid, the app loads no Google tag and shows no analytics-consent prompt.

RepairLens asks visitors to opt in before loading GA4. After opt-in it records sanitized page views and the main repair, guide-search, guide-open, parts-link, and community-help journey. Descriptions, photos, filenames, search text, guide slugs, generated part names, and error text are excluded. See [the tracking plan](docs/analytics/ga4-tracking-plan.md).

In the GA4 property, turn off enhanced-measurement events for page changes based on browser history, outbound clicks, and site search. RepairLens sends manual page views with fixed route templates; these automatic events could otherwise include raw query strings or generated part-search text. After configuring your Measurement ID, opt in on the site and use GA4 DebugView to inspect event names and the approved coarse properties.

## Supabase guide library

Run `supabase/migrations/20261024000000_create_guide_library.sql` in the Supabase SQL Editor, then seed the curated set:

```bash
pnpm seed:guides
```

The migration creates the guide, step, and part tables plus the private `guide-illustrations` storage bucket. The server uses the service-role credential; the browser never receives it. Generated descriptions and source photos are not saved. Generalized, safe DIY plans can be published and reused; photo-specific or unsafe results use unlisted share links.

If Supabase credentials are absent, curated guide pages and search remain available locally. AI results are shown with a clear notice that the shared guide library is not connected.

## Commands

```bash
pnpm dev
pnpm build
pnpm start
pnpm lint
pnpm typecheck
pnpm format
pnpm seed:guides
```

## Routes

- `/` RepairLens home and photo-based repair request
- `/guides/` searchable, paginated repair guide library
- `/guides/[slug]/` individual illustrated repair guides
- `/stories/[slug]/` repair stories and steps taken
- `/repairs/[token]/` private, unlisted generated guides
- `/api/repair-guide` assessment, illustration, deduplication, and Supabase persistence
- `/api/guides` shared guide listing and search
- `/sitemap.xml`, `/robots.txt`, `/llms.txt`, `/llms-full.txt` discovery endpoints

Legacy `/guides.html`, `/guide.html?guide=…`, and `/story.html?story=…` links redirect to the App Router URLs.
