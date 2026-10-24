# Vitni and guide library update

## Intent
Grow the repair library with six practical guides while making Vitni’s Lottie clearly match the mascot illustration. Keep the current lightweight static site and guide flow.

## Goals
- Add two guides each for bikes, household repairs, and clothes, with matching illustrated thumbnails, safe step lists, tools, and parts where relevant.
- Keep existing category filters, six-card pagination, and individual guide pages.
- Rebuild the vector Lottie from Vitni’s existing artwork so the face, eyes, and tools are clear at homepage and guide-hero sizes; retain gentle idle motion and reduced-motion support.
- Remove the manual pause button, as requested.
- Remove decorative route and card-entry animations in the “one clear path” section and name Vitni in the explanatory copy.

## Calls and constraints
- Use the current guide data array and detail template; the library currently has nine guides and supports Bike, Home, and Clothes filters.
- Add six balanced entries. Proposed topics: loose bike saddle, chain cleaning/lubrication, sticking drawer, loose cabinet hinge, small fabric patch, and hand-sewn trouser hem.
- Create a distinct, visually consistent guide illustration for each new card.
- Use the existing DotLottie web player and vector-only animation asset. Keep loops unobtrusive and pause automatically when reduced motion is requested.
- Update the service worker cache version and preserve conventional commit format.

## Approaches
1. **Extend the existing library (chosen):** add six data entries and illustrations, improve the current Lottie, and keep existing filters, pagination, and guide detail pages. This matches the current product and keeps the change focused.
2. **Redesign guide discovery:** add subcategories and a new search/navigation model. This increases scope and is unnecessary for adding six guides.

## Out of scope
A new backend or guide CMS, new repair categories, and a redesign of the overall library layout.

## Approval
User approved a balanced six-guide expansion and keeping the current paginated library on 2026-10-24. Implementation will begin after approval of this design.
