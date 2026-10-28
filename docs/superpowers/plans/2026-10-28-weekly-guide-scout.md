# Weekly Guide Scout Implementation Plan

## 1. Persist scout metadata

- Add a Supabase migration for private scout-run and guide-source tables.
- Add a nullable unique run reference to `guides` for idempotent retries and review navigation.
- Enable RLS, revoke `anon`/`authenticated`, and grant the minimum required table access to `service_role`.

## 2. Build the durable Cloudflare Workflow

- Implement a weekly Workflow using Responses API web search and strict structured output.
- Qualitatively evaluate demand, require real source citations, reject duplicate or high-risk ideas, and create no more than one draft per run.
- Generate one cover and one illustration per step, upload them to Supabase Storage, and persist EN/FR guide content without publishing.
- Add the Monday 08:00 UTC schedule, one-instance concurrency limit, and stable run-level idempotency through the existing Cloudflare config.

## 3. Surface evidence and document review

- Load persisted source citations for published guide detail pages and localize the section label.
- Document required Worker secrets, the Search Console limitation, and the Supabase Studio review checklist.

## 4. Inspect and commit

- Inspect the final diff and repository status; do not stage unrelated files.
- Use a Conventional Commit message for the completed feature.

