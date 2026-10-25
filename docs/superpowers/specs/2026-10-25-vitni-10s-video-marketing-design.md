# Vitni 10-second marketing video

## Intent

Make a short, shareable introduction to Vitni for the hackathon presentation. Show the promise and the product journey: describe a repair, follow clear steps, keep Vitni on a phone as a PWA, browse practical guides, and find local community help.

## Goals

- Create a polished video of about 10 seconds with lively, legible motion.
- Keep the warm ligne claire Vitni identity and use real project photography and copy.
- Give repair steps, phone/PWA, guide library, and Paris community support a visible moment.
- Include on-screen captions so the story works without audio.
- Keep the source alongside the rendered MP4 for easy revisions.

## Non-goals

- No talking-head presenter or generated live-action footage.
- No new product claims beyond the current photo-and-description flow, guide library, installable PWA, and Paris repair-community directory.
- No additional aspect-ratio exports in this pass.

## Approaches considered

1. **Branded motion demo (chosen)** — programmatic 16:9 motion graphics using the existing Vitni artwork, real repair photography, and accurate product interface elements. It keeps text crisp and lets each requested feature read quickly.
2. **Screen recording** — maximizes authenticity, but the complete journey would be too small and fast to read in ten seconds.
3. **AI-generated mini-story** — can look cinematic, but risks changing Vitni’s design and inventing inaccurate interface details.

The user requested a short product presentation and did not select a production direction after being offered these options. The branded motion demo is the recommended default because the interface and repair steps need to remain accurate and readable.

## Proposed sequence

Format: 1920×1080, 16:9, approximately 10 seconds, 30 fps, H.264 MP4. Caption-led; no voiceover. Use brisk but smooth, comic-inspired easing and restrained tool/spark accents.

| Time | Visual and message |
| --- | --- |
| 0.0–1.2 s | Vitni arrives with a small wrench flourish. “Good things deserve another go.” |
| 1.2–3.0 s | A bike repair photo and short description enter the Vitni interface. “Show Vitni what changed.” |
| 3.0–5.1 s | Three numbered repair guide cards step forward: inspect, patch or replace, then refit and test. “Clear steps. Safer fixes.” |
| 5.1–7.0 s | The guide shifts into a phone. A home-screen Vitni icon opens to a standalone guide view. “Your repair sidekick, on your home screen.” |
| 7.0–8.5 s | The guide library fans through bike, home, and clothing repairs. “Guides for everyday things.” |
| 8.5–10.0 s | Paris map card and repair-café pin land beside Vitni. End card: “Meet Vitni · Keep good things going.” |

## Visual direction and implementation calls

- Use the repository’s Vitni illustration, bike repair photo, brand colors, and Manrope / DM Mono typography where the rendering tools support them.
- Build a deterministic, editable source using local rendering tools and existing assets; do not add a video framework dependency.
- Show a representative Vitni install-to-home-screen interaction and a standalone guide screen, matching the existing PWA manifest and product language.
- Show community support as a Paris repair-café discovery card using the locations already listed in the app.
- Store the final MP4, source, and a contact-sheet preview under `marketing/videos/vitni-intro/`.

## Approval

This document is a short design for the requested video. Rendering starts after the user approves it.
