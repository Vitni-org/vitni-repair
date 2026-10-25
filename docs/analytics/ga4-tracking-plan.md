# Vitni GA4 tracking plan

## Operating rules

- GA4 is optional and loads only after a visitor accepts analytics.
- If `NEXT_PUBLIC_GA_MEASUREMENT_ID` is missing or does not match `G-...`, the app renders no consent prompt and makes no Google Analytics request.
- Visitors can reject or later change their choice with **Analytics preferences** in the footer. A rejection or revocation stops app events and sets Google Analytics consent to denied.
- Advertising storage and personalization signals remain denied. Do not enable GA4 enhanced-measurement page history, outbound-click, or site-search events; Vitni sends its own sanitized page views and journey events.
- The app sends only fixed event names, enumerated values, and booleans. Event payloads are event-specific in `src/lib/analytics.ts`.

## Events

| Event                    | Trigger                                                                | Allowed properties                                                                           |
| ------------------------ | ---------------------------------------------------------------------- | -------------------------------------------------------------------------------------------- |
| `page_view`              | Initial load and App Router pathname change                            | `page_path`, `page_title`, `page_type`, sanitized `page_location`, sanitized `page_referrer` |
| `repair_flow_opened`     | Repair CTA in the hero, navigation, or footer                          | `location`: `home_hero`, `site_nav`, `footer`                                                |
| `guide_library_opened`   | Guide-library CTA in the hero, promo, navigation, or footer            | `location`: `home_hero`, `home_promo`, `site_nav`, `footer`                                  |
| `community_help_opened`  | Community CTA, map, directory, or venue link                           | `link_type`: `cta`, `map`, `directory`, `venue`                                              |
| `guide_search_submitted` | Guide search form submit                                               | `area`: `All`, `Bike`, `Home`, `Clothes`; `has_query`: boolean                               |
| `guide_opened`           | Guide card selection                                                   | `source`: `guide_library`                                                                    |
| `repair_request_started` | Repair description passes minimum client validation and request starts | `has_photo`: boolean                                                                         |
| `repair_guide_completed` | Repair endpoint returns a valid assessment                             | `safety`: `safe_diy`, `get_help`, `do_not_attempt`; `saved`, `reused`, `has_photo`: booleans |
| `repair_guide_failed`    | Repair request fails                                                   | `stage`: `request`                                                                           |
| `parts_link_opened`      | Part search/link from a guide or generated plan                        | `page_context`: `guide_detail`, `generated_plan`                                             |

## Page sanitization

Page paths are rebuilt from route templates. Guide detail pages report `/guides/[guide]/`; story detail pages report `/stories/[story]/`; the guide library and home use their fixed paths. Any other route reports `/[page]/`. `page_location` is the current origin plus this approved path. Internal referrers use the same route mapping; external referrers are reduced to their origin. Query strings, hashes, guide/story slugs, and generated repair tokens are excluded.

## Never collect

- Repair descriptions, uploaded photo bytes, filenames, or photo metadata.
- Raw guide search text, search result titles, or query strings.
- Guide/story slugs, generated repair tokens, personal data, addresses, or full browser URLs.
- Generated part names, part URLs, map destinations, repair instructions, API responses, or error messages.
- User IDs, advertising identifiers, session-replay data, or any additional custom dimension without revising this plan.

## Setup

Set `NEXT_PUBLIC_GA_MEASUREMENT_ID` to the GA4 web stream's actual `G-...` ID locally and in the deployment environment. Restart/redeploy, opt in on the site, then inspect the named events and approved fields in GA4 DebugView. Keep the visitor's consent choice respected when using browser debug tools.
