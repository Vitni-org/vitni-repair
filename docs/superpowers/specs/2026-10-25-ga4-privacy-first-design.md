# GA4 usage tracking design

## Intent

Give RepairLens a useful view of how visitors move through the site and reach a repair outcome. Use GA4 only after a visitor opts in. Do not send repair descriptions, photos, filenames, raw guide searches, guide slugs, generated part names, or error messages.

## Goals

- Measure page views with sanitized route names.
- Measure guide search and guide-detail navigation without sending the search text or guide slug.
- Measure repair requests, successful plans, saved/reused outcomes, and failures using only coarse flags and safety categories.
- Measure entry into repair, guide, and community journeys, plus clicks to parts and local help.
- Let visitors accept, reject, and later change optional analytics consent.
- Keep tracking off when no GA4 Measurement ID is configured.

## Non-goals

- Advertising pixels, Google Ads conversions, user IDs, session replay, or a Tag Manager container.
- Sending photos, prompts, form values, personal data, full URLs, or generated content to Analytics.
- Creating a legal privacy policy or configuring a GA4 property on the user's behalf.

## Approaches considered

1. **Opt-in only (chosen default):** load the Google tag only after consent. This sends no Analytics requests before consent or after rejection. It is the privacy-conservative fit for a Paris-based site.
2. **Consent Mode with denied defaults:** load the tag for everyone and send limited cookieless pings before consent. This may improve modeled reporting but still contacts Google before opt-in.
3. **Page views only:** the smallest implementation, but it would not answer how visitors use the repair flow, guides, or community links.

The user requested main-journey tracking. Use approach 1 and the events below.

## Events

| Event | Trigger | Properties |
|---|---|---|
| `page_view` | Initial load and App Router path change | sanitized `page_type`, sanitized path/title |
| `repair_flow_opened` | Repair CTA click | static `location` |
| `guide_library_opened` | Guide CTA click | static `location` |
| `community_help_opened` | Community CTA, map, directory, or venue link click | static `link_type` |
| `guide_search_submitted` | Guide search form submit | static area filter, `has_query` boolean |
| `guide_opened` | Guide card/detail navigation | static `source`; no slug/title |
| `repair_request_started` | Valid repair form submit | `has_photo` boolean |
| `repair_guide_completed` | Successful response | safety enum, saved/reused booleans, `has_photo` |
| `repair_guide_failed` | Failed response | static failure stage only |
| `parts_link_opened` | Part search/link click | static page context only |

Do not enable automatic enhanced-measurement click or site-search events: their URLs could contain dynamic query or generated part text. Page views will be manual, with query strings and dynamic slugs removed.

## Consent and loading

- Use an accessible, non-modal banner with separate **Accept analytics** and **Reject optional analytics** actions.
- Store the choice in local storage; add a persistent footer control to change it.
- Do not inject `gtag.js` until consent is granted. If consent is withdrawn, stop emitting events and set the tag's Analytics consent to denied.
- Read the public Measurement ID from `NEXT_PUBLIC_GA_MEASUREMENT_ID`. With no valid `G-...` value, render no banner, script, or events.
- Disable automatic page views and send one sanitized page view per route change.

## Open setup item

The Measurement ID is not configured in the local environment. Add the variable to `.env.example` and document that the owner must set the actual GA4 web-stream ID locally and in the deployment environment. Do not commit credentials or modify `.env`.

## Validation

- With no Measurement ID, confirm there is no Google tag or consent prompt.
- With a test Measurement ID, confirm there are no Google requests before opt-in or after rejection, and that route/page events do not include search queries or dynamic slugs.
- Confirm consent acceptance enables events, the preference control can revoke it, and the event properties contain no user-entered content.
