# Vitni and Guide Library Implementation Plan

> **For agentic workers:** Execute inline, one task at a time. Keep changes in small, reviewable commits.

**Goal:** Add six illustrated repair guides and make Vitni’s animated mascot consistently show a friendly face and useful tools across the homepage and guide pages.

**Architecture:** Extend the existing `guides` array and page-size-6 client pagination. Add six self-contained SVG illustrations served as normal assets. Rebuild the vector-only Lottie from the existing mascot proportions, adding a visible face and a tool in each hand; keep the current DotLottie player and automatically disable autoplay for reduced-motion users.

**Tech Stack:** Static HTML, CSS, JavaScript, SVG, Lottie JSON, `@lottiefiles/dotlottie-web`.

**Spec:** `docs/superpowers/specs/2026-10-24-vitni-and-guide-library-design.md`

## Global Constraints

- Keep the current static guide data model, Bike/Home/Clothes filters, and six-card pagination.
- Add two balanced guides for each current category, with safety notes, tools, and replacement parts only when relevant.
- Make Vitni’s animated art match the existing mascot: dark-green screen face, bright eyes and smile, coral details, screwdriver and wrench.
- Remove the manual animation pause button and the decorative route animation from the “one clear path” section.
- Respect `prefers-reduced-motion` and keep the mascot loop subtle.
- Update the service worker cache version and use conventional commit messages.
- Do not add an automated test suite; verify syntax, JSON, cache entries, and the rendered pages.

---

### Task 1: Add the six balanced repair guides

**Files:**
- Modify: `guide-library.js`

**Interfaces:**
- Consumes the existing `guides` data array, `renderGuideLibrary()`, filters, and pagination.
- Produces six additional entries compatible with `guide-page.js` fields: `id`, `area`, `title`, `desc`, `image`, `alt`, `level`, `time`, `steps`, `safety`, `tools`, and `parts`.

- [ ] Add these guides, keeping every step in plain language and limiting each plan to four or five steps:
  - `bike-saddle` — **Tighten a loose bike saddle**; Bike; easy; 10 min. Support the bike, align the saddle, tighten the clamp to its marked torque, then check stability. Stop if rails, clamp, or seatpost are cracked. Tools: correctly sized hex key and a torque wrench when a torque value is marked. Parts: a matching clamp bolt only if damaged.
  - `bike-chain-care` — **Clean and lubricate a bike chain**; Bike; easy; 15 min. Shift to the smallest rear cog, wipe the chain, apply bicycle chain lubricant sparingly to the rollers, backpedal, wipe excess, and test. Keep lubricant off braking surfaces. Tools: rag, bicycle chain lubricant. Parts: none.
  - `drawer-track` — **Reseat a drawer that slips off its track**; Home; easy; 10 min. Empty and support the drawer, extend both runners, align the drawer rails, slide it in evenly, then test gently. Stop rather than forcing bent runners. Tools: screwdriver. Parts: matching runner only if damaged.
  - `cabinet-hinge` — **Tighten a loose cabinet door hinge**; Home; easy; 15 min. Support the door, tighten mounting screws, make small adjustment-screw turns, and test alignment. Stop if the board is split or the hinge is pulling out. Tools: screwdriver, helper for a heavy door. Parts: matching hinge screws if missing or stripped.
  - `fabric-patch` — **Patch a small hole in clothing**; Clothes; easy; 25 min. Turn the garment inside out, trim only loose threads, place a compatible fabric patch behind the hole, stitch around its edges, and check the front. Choose a patch with similar stretch and weight. Tools: needle, thread, small fabric patch, scissors. Parts: matching patch and thread.
  - `trouser-hem` — **Sew a simple trouser hem by hand**; Clothes; easy; 30 min. Try trousers on with intended shoes, mark and pin the fold, press the fold, sew small even stitches inside the fold, and test the length. Keep pins and needle away from the body while wearing; remove trousers before sewing. Tools: needle, matching thread, pins, iron. Parts: matching sewing thread.
- [ ] Run `node --check guide-library.js` and inspect the six entries for correct field names, image paths, and category values.

### Task 2: Draw matching guide-card illustrations

**Files:**
- Create: `images/guides/bike-saddle.svg`
- Create: `images/guides/bike-chain-care.svg`
- Create: `images/guides/drawer-track.svg`
- Create: `images/guides/cabinet-hinge.svg`
- Create: `images/guides/fabric-patch.svg`
- Create: `images/guides/trouser-hem.svg`
- Modify: `guide-library.js` (connect entries to these assets)

**Interfaces:**
- Each SVG is a standalone `viewBox` illustration consumed by the guide-card `<img>` with an accurate alt description.
- Use the existing cream, forest green, lime, and coral palette and bold simple outlines to match current illustrated guides.

- [ ] Create one recognizable scene per guide: saddle clamp with hex key; chain and oiled rag; drawer rail being reseated; cabinet hinge and screwdriver; fabric patch being sewn; trouser cuff being hand-stitched. Keep backgrounds transparent or cream and avoid embedded step text.
- [ ] Set each guide entry’s `image` and `alt` to the corresponding asset and scene.
- [ ] Parse every SVG as XML and verify all six files exist.

### Task 3: Refine Vitni’s mascot artwork and animation controls

**Files:**
- Modify: `images/vitni.svg`
- Modify: `animations/vitni-repair.json`
- Modify: `hero-lottie.js`
- Modify: `index.html`
- Modify: `guides.html`
- Modify: `guide-page.js`
- Modify: `presentation.css`

**Interfaces:**
- Keep the existing canvas IDs and DotLottie player usage so homepage, guide library, and individual-guide hero mount the same animation.
- Preserve the current safety prompt mascot artwork, updating it to match Vitni’s final face and tools.

- [ ] Add clear lime eyes and a simple smile to the Lottie face screen. Add a coral-handled screwdriver in one hand and a visible open-ended wrench in the other, matching the static SVG.
- [ ] Refine the loop with a gentle body bob, a small tool-hand wave, and brief blinks. Keep all keyframes within the existing 90-frame, 30-fps loop and keep the composition vector-only.
- [ ] Remove the Pause animation control and its JS state/event handling. Keep reduced-motion autoplay behavior.
- [ ] Remove the decorative route from the presentation-flow markup and its CSS, and rewrite the lead copy to explicitly name Vitni (for example: “Vitni turns a photo and a few words into a practical repair plan…”).
- [ ] Keep labels and credits consistent: “Vitni · your repair sidekick.”
- [ ] Parse the Lottie JSON and SVG, run `node --check hero-lottie.js`, and confirm all references to the removed pause control are gone.

### Task 4: Integrate offline cache and verify the experience

**Files:**
- Modify: `sw.js`
- Modify: `index.html`, `guides.html`, `guide.html` asset query versions where needed

**Interfaces:**
- Pre-cache the six new SVG guide illustrations and the updated Vitni Lottie; keep the existing repair loading animation.

- [ ] Increment the cache name and add each new asset exactly once to the precache list.
- [ ] Run `git diff --check`, static syntax/JSON/XML validation, and inspect all asset references for missing files.
- [ ] Open the homepage, guide library, and one individual guide at the local preview. Confirm the face and both tools are visible, the motion control is absent, the presentation route animation is absent, and the six added guide cards appear under their filters/pagination.
- [ ] Commit with a conventional message such as `feat(guides): add six illustrated repair guides` and a separate mascot/motion commit if the changes are easier to review separately.
