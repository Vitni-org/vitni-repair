# Task 3 report: SEO, social previews, discovery files, and sharing

## Implemented

- Added a single metadata renderer to the static-site build. It creates escaped, absolute canonical, Open Graph, Twitter, and JSON-LD metadata for the homepage, guide library, every guide, and every story.
- Added truthful structured data: `WebSite` and `Organization` for the homepage, `HowTo` data based on each visible guide, and `CreativeWork` data for the visibly labeled simulated demo stories. No author, date, rating, or review fields were invented.
- Added a static 1200×630 RepairLens social card at `images/og/repairlens-share.png`, with its editable SVG source alongside it. It uses the existing palette and a visible-eyed Vitni holding a repair tool.
- Added the accessible detail-page share panel and `share.js`. It attempts native sharing, then clipboard copy, then selects the already-visible readonly canonical URL for manual copying. Native share cancellation is ignored rather than reported as an error.
- Added generated `robots.txt`, `sitemap.xml`, `llms.txt`, and `llms-full.txt`. The sitemap contains only clean canonical routes; the long-form file is derived from shared guide/story records and retains safety notes, steps, tools, and URLs.
- Added `PUBLIC_SITE_URL` build documentation and the `dist/` deployment note to the README. The build reads only the public-origin setting from `.env` when the process environment does not supply it; it does not print `.env` content.

## Verification

- Ran `npm run build` successfully with the default origin, producing 15 guide pages and 4 story pages.
- Built once with `PUBLIC_SITE_URL=https://preview.example.test/temporary` and inspected a generated guide, sitemap, robots file, structured data, social image, and visible share URL; each used the normalized `https://preview.example.test` origin. Rebuilt with the default origin afterward.
- Inspected generated metadata for the homepage, guide listing, JPEG-backed `bike-chain` guide, WebP-backed `bike-flat` guide, and `bike` story. JPEG pages use their relevant JPEG image; the WebP guide uses the 1200×630 PNG card. All inspected metadata URLs are absolute.
- Opened the exported PNG and confirmed it is readable at 1200×630, uses the RepairLens palette, keeps text safely inside the crop, and shows Vitni's eyes and repair tool.
- Ran `git diff --check` successfully. No test suite was added or run, per the task constraint.

## Notes and remaining limitations

- `llms.txt` and `llms-full.txt` are optional discovery aids; they make no ranking or citation claims.
- The guide `HowTo` data describes the page semantically and makes no promise about Google How-to rich-result display.
- Generated `dist/` remains intentionally ignored. Deployments must run `npm run build` first (and `npm start` does so locally).
