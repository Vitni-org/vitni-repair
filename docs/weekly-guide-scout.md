# Weekly guide scout

Vitni's Cloudflare Worker starts one durable guide-scout Workflow every Monday at 08:00 UTC, with concurrency limited to one run. Each run researches one repair intent, saves a bilingual English/French draft, and generates a cover plus one image for each of three or four steps. The run is limited to five generated images, and guide status always remains `draft`.

## Research limits

The scout uses OpenAI Responses web search to find qualitative evidence and stores the actual cited HTTPS sources. It does not have Google Search Console credentials, so it must not claim Google query volume, rankings, or traffic figures. Search Console query/impression data can be added after OAuth access is configured.

The scout prefers general, beginner-friendly repairs and skips duplicate, highly specific, unsafe, or insufficiently sourced topics. It must not invent exact part dimensions, retailer stock, products, prices, or purchase links. OpenAI search and image generation consume the configured API account; the weekly schedule, one-topic limit, and five-image cap bound each run.

## Required setup

Apply `supabase/migrations/20261028000000_add_weekly_guide_scout.sql` before enabling the scheduled Workflow. The deployed `repairlens` Worker must have these server-only secrets:

- `OPENAI_API_KEY`
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`

The existing `guide-localizations` table and private `guide-illustrations` Storage bucket must also be available. Do not put service keys in public `NEXT_PUBLIC_*` variables.

## Review and publish

1. In Supabase Studio, open `guide_scout_runs` and filter `status = drafted`.
2. Read the topic, target keyword, qualitative demand note, and run result. The guide links back through its `scout_run_id`.
3. Inspect the matching `guides` row (same `scout_run_id`), its `guide_steps`, French `guide_localizations`, and all rows in `guide_research_sources` for the same `run_id`.
4. Check that the cited sources support the steps, the EN/FR instructions agree, images show the described action, compatibility is not guessed, and safety advice is sound.
5. Only after that review, change the guide's `status` from `draft` to `published`. The public guide detail page then displays its cited sources.

Runs with `skipped` did not create a guide. Runs with `failed` need investigation; a partially written guide remains a private draft and is never published automatically.

