# Task 4 — Accessibility and motion remediation

## Scope completed

- Added skip links and stable `main` landmarks across the home, guide index, legacy detail shells, and generated guide/story detail pages.
- Kept one page-level H1 per route and adjusted the homepage result-side heading to preserve heading order.
- Turned the homepage diagnosis controls into a native form with named inputs, visible label/help, inline linked errors, and a submit button. Empty and request-failure submissions return focus to the description field.
- Kept optional-photo and generation progress feedback in polite status regions. Safety state is expressed in text as well as with its decorative dot.
- Added the same labeled description/error pattern to the guide-index form.
- Made guide-library changes announce one concise result/page status instead of making the card grid a live region. Filter pressed state, pagination disabled state, and keyboard focus are retained after updates.
- Preserved the existing native controls and accessible menu toggle/Escape handling; buttons, filters, pagination, story switches, photo actions, and share controls remain keyboard-operable.
- Added image dimensions/aspect-ratio coverage for generated guide/story images and preview media to reduce layout shift.
- Added story-specific descriptive image alt text in shared data; generated story HTML and social metadata use that text.
- Kept canvases decorative and paired them with nearby Vitni text. Lottie players are not created when reduced motion is active; hero and guide-index views show static decorative Vitni art in that mode. Existing CSS motion is also disabled under reduced-motion preferences.
- Strengthened visible focus coverage for native text inputs, kept sticky-header scroll clearance, and checked the narrow layout without horizontal scrolling.

## Verification performed

- `npm run build` completed successfully; the generated output contains the skip links, landmarks, form semantics, status regions, image dimensions, and story-specific alt text.
- Local preview: `http://localhost:4188` on port 4188.
- Manual keyboard walkthrough in the local preview:
  - Homepage: skip link/name tree inspected; empty description submission showed the inline linked error and focused the description field.
  - Menu: Space opened the menu, Escape closed it, and focus returned to the menu button.
  - Guides: Enter selected a filter, kept focus on the selected filter, updated `aria-pressed`, and announced the result count; Enter advanced pagination and kept focus on the page control.
  - Guide and story details: share controls were reachable and keyboard-invoked; the story detail exposed the descriptive lamp image alt text in the browser accessibility tree.
  - Narrow viewport (375px): homepage and guide index both reported no horizontal document overflow.
- Reduced-motion implementation was source- and generated-output-reviewed. The available preview browser reported normal motion and did not expose a reduced-motion emulation control, so the OS/browser preference-on runtime visual state was not manually observed.

## Remaining limitations

- No screen-reader product walkthrough or browser accessibility-tree audit beyond the available local browser tree was performed.
- Browser zoom at an actual 200% setting and an operating-system reduced-motion preference could not be toggled in the available browser controls; narrow-width overflow was checked instead.
- The preview did not surface a share completion status when its platform share path was invoked, so browser-specific share-dialog/clipboard behavior remains platform-dependent.
- This remediation improves accessibility but does not claim WCAG conformance or certification.

## Scope guard

No mascot artwork, Vitni animation JSON, OG artwork, or the separate untracked mascot-plan document was included in this task.
