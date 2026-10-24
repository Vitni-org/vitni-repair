# RepairLens Discoverability Foundations Implementation Plan

> **For agentic workers:** Implement inline task-by-task using this plan. Each task is a review checkpoint.

**Goal:** Make RepairLens pages indexable, shareable, agent-readable, and more accessible while preserving its current responsive static-site experience.

**Architecture:** Move guide and story records to shared JavaScript data modules used by both the browser and a Node static generator. Generate complete clean-URL HTML into `dist/`, including page-specific metadata and body content, and have the existing Node server serve that output. Add discovery/share assets, then address the accessibility issues while retaining progressive enhancement.

**Tech Stack:** Existing vanilla HTML, CSS, browser JavaScript, Node.js ESM static server, and current media assets. Use the configured image-generation tool only for the branded 1200×630 social image; add no runtime package dependencies.

**Spec:** `docs/superpowers/specs/2026-10-24-discoverability-foundations-design.md`

## Global Constraints

- Use `https://vitni.cc` as the default public origin and support a `PUBLIC_SITE_URL` environment override.
- Keep complete guide/story content in the initial HTML response without requiring JavaScript.
- Preserve existing `/guide.html?guide=…` and `/story.html?story=…` URLs as browser-compatible redirects to clean canonical paths.
- Keep the project on its current vanilla static stack and local `npm start` workflow.
- Keep the generated output reproducible and out of source control; build it before serving or deploying.
- Do not add or run a test suite. Validate through successful generation, direct HTML inspection, and manual browser/keyboard review.
- Do not claim ranking, AI citation, rich-result, or WCAG conformance guarantees.

---

## File map

- Create `site-data.js`: shared guide and success-story records imported by browser scripts and the static generator.
- Create `scripts/build-site.mjs`: copy the allowlisted public files to `dist/`, render guides and story HTML, and write metadata/discovery outputs.
- Create `templates/guide-detail.html` and `templates/story-detail.html`: semantic shells with one `{{PAGE_META}}` and one `{{PAGE_CONTENT}}` insertion marker each.
- Create `share.js`: accessible native-share, clipboard, and manual-copy behavior.
- Create `images/og/repairlens-share.png`: branded 1200×630 Open Graph image with Vitni and legible brand copy.
- Create `robots.txt`, `sitemap.xml`, `llms.txt`, and `llms-full.txt` as build outputs using the configured public origin and shared content.
- Modify `package.json` and `.gitignore`: add build/prestart commands and ignore generated `dist/`.
- Modify `server.mjs`: serve `dist/` safely while reading `.env` from the project root; return proper 404/405 and redirect legacy query URLs.
- Modify `index.html`, `guides.html`, `guide.html`, and `story.html`: add semantic metadata slots, static library content, progressive enhancement, share controls, and accessible defaults.
- Modify `guide-library.js`, `guide-page.js`, and `case-study.js`: import shared data, preserve library interactions, and enhance pre-rendered detail pages rather than creating their main content client-side.
- Modify relevant CSS (`styles.css`, `library.css`, `guide-ai.css`, `repair-prompt.css`, and `hero-lottie.css`): fix accessibility issues and style share controls/cards without changing the visual identity.
- Modify `sw.js` and `README.md`: cache the generated public routes/assets and explain base URL, build, and static deployment.

## Task 1: Share guide and story data across Node and browser

**Files:**
- Create: `site-data.js`
- Modify: `guide-library.js`
- Modify: `guide-page.js`
- Modify: `case-study.js`
- Modify: `guides.html`, `guide.html`, and `story.html`

**Interfaces:**
- `site-data.js` exports `guides` as the current ordered array of guide records and `stories` as the current map of story records. Preserve every field used by the current pages: `id`, `area`, `title`, `desc`, `image`, `alt`, `level`, `time`, `steps`, `safety`, `tools`, and `parts` for guides; `title`, `tag`, `time`, `image`, `situation`, `tools`, `safety`, `steps`, and `outcome` for stories.
- `guide-library.js` imports `{ guides }` and continues to expose the same filtering and six-item pagination behavior.
- Detail scripts read `data-guide-id` / `data-story-id` from static page markup; legacy query URLs are redirected by the server or browser shim.

- [ ] Move the current guide array into `site-data.js` without changing repair copy, order, IDs, or image paths.
- [ ] Move the current story object into `site-data.js` as `stories`; preserve its four IDs and safety/outcome fields.
- [ ] Change `guide-library.js` to import `{ guides } from './site-data.js'`; leave filter names, URL state, page size, and click behavior intact.
- [ ] Change guide detail enhancement to resolve the static `data-guide-id` from the module and only request illustrations/update status; do not create headings or instructions that are absent from the HTML.
- [ ] Change story detail enhancement to resolve the static story ID for legacy-query redirects and remove client-only page rendering. Leave share-button binding to Task 3, when static share controls are added.
- [ ] Mark relevant scripts as ES modules and preserve script load order; load shared data before the library/detail enhancement module.
- [ ] Inspect representative records in the new module against the existing source to ensure all repair steps and safety text are retained.

## Task 2: Generate complete static pages and clean routes

**Files:**
- Create: `scripts/build-site.mjs`
- Modify: `package.json`, `.gitignore`, `server.mjs`, `guides.html`, `guide.html`, `story.html`, `guide-library.js`, `guide-page.js`, `case-study.js`, `index.html`
- Generated in `dist/`: homepage, guide library, `/guides/{id}/index.html`, `/stories/{id}/index.html`, copied static assets

**Interfaces:**
- `PUBLIC_SITE_URL` is normalized to an origin using `new URL(value).origin`; it defaults to `https://vitni.cc`.
- `scripts/build-site.mjs` exports or internally defines `canonicalPath(type, id)`, `renderGuidePage(guide, origin)`, `renderStoryPage(story, origin)`, and `buildSite()`.
- Canonical paths are `/`, `/guides.html`, `/guides/{id}/`, and `/stories/{id}/`.
- `npm run build` regenerates all deployable output; `npm start` runs the build before starting the server.

- [ ] Add the Node build script. It removes and recreates `dist/`, copies only public root `.html`, `.js`, `.css`, `.svg`, `.webmanifest` files plus `images/` and `animations/`, then writes generated detail pages and discovery files.
- [ ] Add `templates/guide-detail.html` and `templates/story-detail.html`, each with one `{{PAGE_META}}` and one `{{PAGE_CONTENT}}` marker. Exclude these templates from copied public output.
- [ ] Add `<!--REPAIRLENS_GUIDE_CARDS-->` to the source library grid and render all guide cards into the marker in initial `dist/guides.html`. Browser JavaScript may replace that full grid with the selected filter/page after load.
- [ ] Render each guide detail HTML with `<main>` containing visible area/level, exactly one H1, description, time, written ordered steps, safety text, tool/parts lists, image alt text, related-guide/home links, and the existing `figure[data-visual]` illustration enhancement containers.
- [ ] Render each story detail HTML with the story image, alternative text, situation, ordered step titles/copy, safety note, tools, and outcome. Add internal links to the guide library and related guide when an ID is known.
- [ ] Add clean guide/story links throughout homepage cards, guide cards, breadcrumbs, and related-content links.
- [ ] Add legacy redirect handling for `/guide.html?guide={id}` and `/story.html?story={id}`. Validate IDs against shared data; map valid values to clean routes and send unknown values to `/guides.html` or `/` with a permanent redirect. Keep a client-side redirect shim in legacy HTML for static hosts without custom redirect rules.
- [ ] Change `server.mjs` to serve `dist/`, read `.env` from the source root, normalize paths against the distribution root, and preserve MIME handling for HTML/CSS/JS/JSON/SVG/WebP/JPEG/PNG/webmanifest.
- [ ] Add `"build": "node scripts/build-site.mjs"` and `"prestart": "npm run build"` to package scripts; add `/dist/` to `.gitignore`.
- [ ] Run the build command and inspect generated homepage, one guide, one story, and copied assets directly in `dist/`; verify output reproduces when run a second time.

## Task 3: Add SEO, social previews, discovery files, and accessible sharing

**Files:**
- Create: `share.js`
- Create: `images/og/repairlens-share.png`
- Generated in `dist/`: per-route metadata, `robots.txt`, `sitemap.xml`, `llms.txt`, and `llms-full.txt`
- Modify: `scripts/build-site.mjs`, `index.html`, `guides.html`, `guide.html`, `story.html`, `guide-page.js`, `case-study.js`, `styles.css`, `library.css`, `README.md`

**Interfaces:**
- Every generated page has a unique `title`, `description`, absolute self-referencing canonical, `og:type`, `og:title`, `og:description`, `og:url`, `og:image`, `og:image:width`, `og:image:height`, `twitter:card=summary_large_image`, `twitter:title`, `twitter:description`, and `twitter:image`.
- Each page's social image is absolute and points to PNG/JPEG. Story pages and guides with JPEG/PNG imagery use their relevant image; SVG/WebP guide pages use the default 1200×630 brand card.
- `share.js` attaches to `[data-share-button]`, obtains the page title and `link[rel=canonical]`, calls `navigator.share()` when available, falls back to `navigator.clipboard.writeText()`, and exposes manual URL copy when clipboard access is unavailable.
- Share status updates a visible `role="status"` polite region.

- [ ] Add a single, non-runtime image-generation step to create the branded social card: warm paper background, dark green/lime palette, Vitni with his visible eyes and repair tool, short “Keep good things going” copy, strong contrast, and no text near crop edges. Export a readable 1200×630 PNG at `images/og/repairlens-share.png`.
- [ ] Add a visible share button and a labeled readonly canonical URL fallback to guide and story detail templates; mark decorative icons hidden from assistive technology.
- [ ] Implement native share, clipboard fallback, and manual selection fallback in `share.js`. Catch user cancellation separately so canceling a native share is not announced as an error; announce success or actionable failure in `role=status`.
- [ ] Add one SEO metadata renderer to `build-site.mjs`. Escape all title/description/URL values for HTML attributes; serialize page data as JSON-LD safely, escaping `<` before insertion.
- [ ] Add `WebSite` and `Organization` JSON-LD to the homepage with `name=RepairLens`, `url=https://vitni.cc/`, and the existing brand image. Add a truthful `HowTo` description to guide pages and `CreativeWork` to demo story pages; match visible content and do not invent authors, publication dates, ratings, or reviews. Do not present `HowTo` as a Google rich-result feature; Google deprecated that search display.
- [ ] Generate `robots.txt` with `User-agent: *`, `Allow: /`, and the absolute sitemap location. Do not block AI search or training bots in this release.
- [ ] Generate `sitemap.xml` from the exact clean canonical route list, XML-escaping URLs and omitting query/legacy URLs.
- [ ] Generate `llms.txt` with a short factual RepairLens description and linked page inventory. Generate `llms-full.txt` from shared guide/story records as Markdown with safety notes, steps, tool requirements, and canonical URLs. Do not label these as ranking factors.
- [ ] Add a page-level visible share action to generated detail pages; keep copy/link fallback usable without JavaScript.
- [ ] Update `README.md` with `PUBLIC_SITE_URL`, `npm run build`, `npm start`, the `dist/` deployment directory, and the reminder to configure `https://vitni.cc` at the host.
- [ ] Inspect generated metadata for homepage, guide listing, a JPEG guide, an SVG/WebP guide, and one story; confirm absolute image URLs resolve and unsupported guide formats use the 1200×630 brand card.

## Task 4: Remediate accessibility and motion issues

**Files:**
- Modify: `index.html`, `guides.html`, `guide.html`, `story.html`, `app.js`, `guide-library.js`, `guide-ai.js`, `guide-page.js`, `case-study.js`, `hero-lottie.js`, `styles.css`, `library.css`, `guide-ai.css`, `hero-lottie.css`, `repair-prompt.css`

- [ ] Review all interactive controls for accessible names, semantic control type, keyboard activation, clear state, and minimum 24×24 CSS-pixel target area; preserve the current 44px touch controls where already present.
- [ ] Ensure all pages have a skip link to a main landmark, one H1, hierarchical section headings, visible focus, and scroll offset that prevents sticky navigation from covering focused anchors.
- [ ] Make the homepage issue description a real labeled form control with a `name`; place photo/description actions in a semantic form without breaking current submit behavior. Keep the optional-photo status and generated guide status available through polite live regions.
- [ ] Make guide filter, pagination, story selection, menu, upload/remove photo, and share actions keyboard-operable. For filter/pagination updates, keep `aria-pressed`/disabled state correct and announce result counts in a status region without over-announcing every card.
- [ ] On analysis errors, add an inline error linked to the relevant field and focus the description or status target on submit failure; do not depend on color alone for safety state.
- [ ] Add explicit width/height or `aspect-ratio` to meaningful images to reduce layout movement. Keep decorative Vitni/Lottie canvases hidden from screen readers and expose an equivalent concise description in text.
- [ ] Update the Lottie/canvas start path to honor `prefers-reduced-motion` before playback; when reduced motion is enabled show the static Vitni mark/art and do not start a looping animation. Preserve the current no-pause-button requirement.
- [ ] Review text/background and focus ring contrast in normal, hover, selected, and disabled states; keep browser zoom enabled and repair any horizontal overflow at 200% zoom and narrow mobile widths.
- [ ] Perform a manual keyboard-only walkthrough of homepage, photo/description form, guide filters/pagination/detail/share, story detail/share, and menu; confirm status feedback can be perceived without pointer input.
- [ ] Perform a manual reduced-motion walkthrough and check browser accessibility tree/names for primary controls; report any remaining limitations in the completion summary without asserting WCAG certification.

## Task 5: Refresh offline assets and commit

**Files:**
- Modify: `sw.js`, `README.md`, and any implementation files above

- [ ] Update service-worker assets to include the clean guide/story URLs, `robots.txt`, `sitemap.xml`, `llms.txt`, `llms-full.txt`, share script, and OG image. Keep navigation fallback working when offline.
- [ ] Start with `npm start`; navigate to homepage, guide library, a clean guide URL, a clean story URL, and legacy query URLs. Confirm the browser shows the right page and clean URL.
- [ ] Inspect the response HTML with JavaScript disabled in browser developer tools; confirm headings, instructions, metadata, and share URLs remain present. Confirm social metadata points only to absolute `https://vitni.cc` URLs by default.
- [ ] Run `git status --short` and `git diff --check`; review the full diff for copied safety text, metadata escaping, and any generated secrets/configuration.
- [ ] Commit all implementation changes with the conventional message `feat(discoverability): add SEO, sharing, and access foundations`.

## Handoff choice

Plan is ready. Execute inline in this session (recommended to avoid extra delegation and keep the static-site changes reviewed together), or request subagent-driven implementation if you want a fresh worker per task.
