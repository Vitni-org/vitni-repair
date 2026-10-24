# Task 1 report: shared guide and story data

## Status

Implemented and committed.

## Implemented

- Moved all 15 guide records from `guide-library.js` into `site-data.js` as the ordered `guides` export, preserving IDs, ordering, copy, image paths, and every field.
- Moved the four existing story records (`bike`, `denim`, `lamp`, `window`) into `site-data.js` as the `stories` export, preserving safety, step, and outcome content.
- Changed the library to import the shared records. Its filter choices, URL state, six-item page size, pagination, and card click URLs remain intact.
- Changed guide enhancement to read `data-guide-id`, use shared data, and request illustrations only for static step markup already present in the page. It updates existing status/illustration elements without rendering guide content.
- Changed story enhancement to read `data-story-id` and wire an existing share button without rendering story content. Legacy query URLs are redirected by the detail module to clean routes (or to the library/home for unknown IDs).
- Marked the library and detail scripts as ES modules and added the data ID attributes to the detail page shells. Module imports load `site-data.js` before enhancement code runs.

## Files changed

- `site-data.js` (new)
- `guide-library.js`
- `guide-page.js`
- `case-study.js`
- `guides.html`
- `guide.html`
- `story.html`

## Verification (no tests run)

- `node --check` passed for `site-data.js`, `guide-library.js`, `guide-page.js`, and `case-study.js`.
- A lightweight module inspection confirmed 15 guide records with all required fields and four story IDs with all required fields.
- Source review checked the full bike saddle guide steps/safety and lamp story steps/safety/outcome against the source records.
- `git diff --check` passed.
- No tests or test suite were added or run.

## Self-review

The guide data was moved directly from the previous array, and story data was moved directly from the previous object. The guide library renderer and its pagination/filter handlers were left unchanged. Detail scripts no longer create headings, instructions, or other page content.

## Concerns

The source `guide.html` and `story.html` shells no longer render full detail content on their own; the approved follow-up static site generator task must generate the clean route pages before deployment. The legacy browser redirect also relies on those clean routes being generated.

## Fix round: remove unavailable story share binding

Removed the story share handler from `case-study.js` as directed by the updated Task 1 brief. The module still reads `data-story-id`, resolves it against `stories`, and redirects legacy `?story=` URLs to the clean story path or home for unknown IDs. Story share behavior is deferred to Task 3, which adds the static controls and status region.

### Exact commands and verification output

Command:

```sh
node --check case-study.js
```

Output: exit code 0 (no syntax diagnostics).

Command:

```sh
if rg -n 'data-share-button|data-share-status|navigator\\.share|clipboard' case-study.js; then printf 'Unexpected share binding remains.\\n'; exit 1; else printf 'No share binding selectors or APIs in case-study.js.\\n'; fi
```

Output:

```text
No share binding selectors or APIs in case-study.js.
```

Command:

```sh
git diff --check
```

Output: exit code 0 (no whitespace errors).

No tests were added or run.
