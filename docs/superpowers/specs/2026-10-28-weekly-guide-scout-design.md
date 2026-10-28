# Weekly Guide Scout Design

## Goal

Create one useful, evidence-backed repair guide draft each week from live web research, with English and French copy, a cover image, illustrated steps, and clickable source citations. The guide library remains human-reviewed: the workflow must never publish a guide.

## Schedule and cost bounds

- Run every Monday at 08:00 UTC using a Cloudflare Workflow schedule.
- Limit the Workflow to one concurrent instance so a slow run cannot overlap the next scheduled run.
- Process at most one candidate per run.
- Generate at most one cover plus four step images per run.
- Use live web search as qualitative evidence. Do not claim Google ranking or search-volume data because Search Console credentials are not configured.
- Treat any generated guide, translated text, and image prompt as untrusted draft content until reviewed.

## Research and quality

- Select a reusable, low-risk repair intent not already represented in the shared library or recent scout runs.
- Search for reliable supporting sources, favoring maker instructions and established repair organizations.
- Persist the primary keyword, related phrases, qualitative demand rationale, research sources, schedule time, status, and any failure reason.
- Require at least two distinct HTTPS sources. If research is insufficient, the run is skipped rather than inventing evidence.
- Only save generalizable `safe_diy` guides. Skip electrical, gas, structural, high-voltage, battery-pack, vehicle safety, and other high-risk candidates.
- Save English canonical copy and a French localization, plus a generated cover and one image for each of three or four steps.
- Keep any uncertain part sizing and compatibility checks explicit. Do not fabricate products or purchase URLs.

## Storage and review

- Store scout runs and citations in private, service-role-only Supabase tables.
- Link scout-generated guide rows to the run and use the existing private `guide-illustrations` bucket.
- Keep each guide in `draft` status, even when every image and translation is ready.
- Review via Supabase Studio: check the scout run's evidence and citations, inspect the guide and ordered steps/images, and only then change `guides.status` to `published`.
- Show source citations on the public guide detail page after a reviewed guide is published.

## Failure handling

- Use durable Workflow steps for research, duplicate checks, guide creation, and each image/upload operation so a later failure does not regenerate completed images.
- Record `failed` or `skipped` run state and a bounded diagnostic message.
- Check existing slugs, exact intent keys, and close title overlap before image generation. Do not create a second draft for a known repair intent.
- Do not expose a public trigger or review endpoint.

## Deferred

- Search Console query impressions/clicks once OAuth credentials and access are configured.
- Automatic publishing, public admin UI, product affiliate links, generated video, and a larger weekly cadence.

