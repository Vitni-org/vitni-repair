# RepairLens Discoverability Foundations

## Intent

Make RepairLens easier to discover, understand, share, and use. Search engines, social platforms, assistive technology, and AI assistants should receive clear page content and metadata directly, while people should retain the current lightweight responsive experience.

The public site base URL is `https://vitni.cc`. The repo is currently a small Node-served static site with guide and story content injected by client JavaScript. There is no configured Git remote, deployment target, or product-marketing brief. The public domain could not be reached by the web lookup during discovery, so the implementation must keep the base URL configurable and document the deployment setting.

## Goals

- Make each common repair guide and success story available as substantive HTML in the initial HTTP response, with a stable shareable URL.
- Give the homepage, guide library, every guide, and each story a useful title, description, canonical URL, Open Graph metadata, and Twitter card metadata.
- Provide one branded 1200×630 share image and page-specific share previews using each page's existing repair image where appropriate.
- Add accessible share actions with Web Share API support and a copy-link fallback; report copy/share feedback to assistive technology.
- Add a sitemap, a permissive robots policy with the sitemap URL, and concise root `llms.txt` / `llms-full.txt` files that accurately describe the product and link to canonical public content. Treat these as discovery aids, not ranking or citation guarantees.
- Add truthful JSON-LD for the site and repair-guide pages, matching visible content and avoiding unsupported claims or review markup.
- Review and fix practical WCAG 2.2 AA issues across home, guides, generated guide detail, and story detail: keyboard operation, focus and announcements, headings/landmarks, form labeling/errors, media/reduced motion, target size, contrast, and responsive zoom.
- Preserve the current visual language, guide data, responsive behavior, existing query URLs as redirects or compatible aliases, and current server-based local presentation flow.

## Non-goals

- Paid or organic social campaigns, social publishing, analytics instrumentation, Search Console onboarding, or backlink outreach.
- An unverified claim of WCAG conformance, guaranteed search ranking, rich results, AI citations, or traffic growth.
- Rewriting repair instructions, adding new product features beyond basic sharing, or replacing the existing vanilla JavaScript/static Node stack.
- Blocking training crawlers as a proxy for blocking search/indexing bots; crawler policy should be explicit and conservative.

## Approaches considered

1. **Site foundations (chosen):** generate crawlable pages, add search/social metadata and share actions, discovery files, and accessibility fixes. This directly addresses the user’s requested social reach, SEO, accessibility, and agent discoverability with a focused project.
2. **Foundations plus social content:** add social-ready repair stories and a richer content distribution flow. This could make publishing easier, but broadens the work into editorial strategy and authoring UI; distribution still requires a human to publish. Deferred.

### Rendering approach (builder decision)

Generate static guide and story detail pages from one shared data source, retaining the current lightweight stack. This gives static hosts and non-JavaScript crawlers complete page HTML while keeping the browser UI interactive. The builder should preserve the existing `guide.html?guide=…` and `story.html?story=…` links as compatible redirects/aliases where practical, use clean stable paths for canonical links, and ensure generated files are reproducible from source data. Do not introduce a framework or a production dependency solely for rendering.

## Scope and behavior

### Search and page identity

- Establish one source of truth for the public origin (`PUBLIC_SITE_URL`, default `https://vitni.cc`), used by generator, canonical metadata, sitemap, and discovery files.
- Give each page a distinct, descriptive title and description. Set self-referencing canonical URLs for clean guide/story routes.
- Add Open Graph and `twitter:card=summary_large_image` metadata, using absolute URLs. Generate a readable 1200×630 brand card and select relevant existing page imagery for guide/story cards.
- Add JSON-LD `WebSite`/`Organization` identity on the homepage and `HowTo` only for repair guides whose visible instructions and properties satisfy the type; use `Article` or `CreativeWork` for stories when supported by actual source details. Structured data must reflect visible content.
- Keep all high-value page content and navigation links present without JavaScript. JavaScript may enhance pagination, filtering, illustrations, and generated repair flows.

### Sharing

- Add a share control to guide and story details, with a clear item-specific label.
- Use `navigator.share` when available and a clipboard-copy fallback elsewhere.
- Announce success/failure in a polite live region; leave the canonical URL visibly available for manual copying if both APIs are unavailable.
- Share image text/illustrations must be legible at mobile social-card sizes and avoid implied real-user testimonials for the demo stories.

### Agent and crawler discovery

- `robots.txt` allows public page crawlers and names the sitemap; do not add directives that accidentally block images, CSS, scripts, or search/answer engines.
- `sitemap.xml` contains only the homepage, guide library, canonical guide pages, and canonical story pages. URLs use the configured origin.
- `llms.txt` gives a concise product summary and links to the guide library and canonical guides/stories. `llms-full.txt` contains a factual, plain-text/Markdown version of the same public content. Avoid invented expertise, outcomes, local availability, or guarantees.
- Keep robots/crawl guidance human-readable and purpose-specific. Do not treat `llms.txt` as a Google ranking factor or promise third-party ingestion.

### Accessibility

- Audit and remediate the page flows to a WCAG 2.2 AA-oriented baseline; report remaining limitations without claiming certification.
- Preserve semantic navigation, one clear page heading, skip links, descriptive labels, visible focus, and alt text; add missing accessible names/descriptions and dimensions where useful.
- Make share feedback, guide filtering/pagination, and generated content updates perceivable without forcing focus movement; handle validation errors with actionable inline text and focus the relevant field when appropriate.
- Ensure menu, filters, pagination, story switches, photo input/drop zone, and share control work with keyboard and touch.
- Respect `prefers-reduced-motion` in canvas/Lottie motion and page transitions; provide a still/static fallback.
- Review contrast, focus visibility, link purpose, minimum interactive target sizing, and layout at zoom/small widths. Keep zoom enabled.

## Constraints and builder decisions

- Keep the vanilla HTML/CSS/JavaScript and Node server model; no framework migration.
- Reuse the existing guide and story content and imagery. Do not change repair safety instructions as part of this work.
- Existing local address remains `http://localhost:4174`; canonical production origin is `https://vitni.cc` unless overridden by deployment configuration.
- The host/deployment pipeline is unknown. The builder must make generated output deployable as static files and document the exact generation command; if generated output cannot be committed, the start/deploy workflow must build it before serving.
- External accessibility/search tools may not be installed. Use source inspection and browser/manual checks available locally; do not claim automated conformance if no audit engine is run.

## Acceptance criteria

1. Every canonical homepage, library, guide, and story URL returns a complete `<title>`, description, canonical, Open Graph/Twitter metadata, and meaningful main content without client JavaScript.
2. Guide/story page content has one H1, correctly ordered sections, stable internal links, and useful image alternatives; old query-form links continue to open the corresponding item.
3. Sitemap and both agent-readable files use only `https://vitni.cc` canonical URLs by default, and the public origin can be changed in one documented setting.
4. Guide/story sharing works with native share where supported and clipboard/manual link fallback otherwise, with status announced accessibly.
5. Page data has valid, truthful JSON-LD matching visible content, and contains no unsupported aggregate-rating/review or fake author claims.
6. Keyboard-only use can reach and operate all navigation and sharing controls; focus remains visible; reduced-motion preferences suppress decorative animation; responsive layout keeps text and actions usable at 200% zoom.
7. `npm start` remains the local entry point and generated pages can be reproduced from tracked source files.

## Open implementation choices

- Choose and document whether generated HTML is committed or produced by `npm run build` before serving/deploying; favor reproducibility and a simple static deployment.
- Verify actual serialized HTML and metadata using the local server; if the configured domain becomes reachable, confirm its production headers and social card behavior separately.
- Add a small static validation script only if needed to guard required page metadata and discovery files. No analytics or third-party trackers.
