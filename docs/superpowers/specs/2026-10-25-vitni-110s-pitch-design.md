# Vitni 110-second product pitch

## Intent

Expand the approved 10-second teaser into a concise hackathon product presentation. The video should make Vitni’s current repair flow tangible, show the guide library, PWA, and Paris community support, then invite the local repair network Vitni needs next.

## Audience and outcome

People seeing Vitni for the first time: hackathon judges, potential users, and potential Paris repair partners. By the end, they should understand what Vitni does, see one repair flow, and know that the next step is recruiting local repair partners before expanding to other cities.

## Goals

- Deliver a 16:9 motion-design video with a live, time-coded talk track, comfortably under two minutes.
- Demo photo plus description → likely issue and safety-first steps using the existing slipped-chain guide.
- Show the illustrated guide library, responsive installable PWA, and Paris repair-café/community discovery.
- Clearly label cafés, ateliers, repairers, and parts shops as partners Vitni is seeking, not partners already secured.
- Pair the MP4 with a speaking script that is easy to present live.

## Non-goals and anti-goals

- No synthetic narrator; the user presents the talk track live.
- No invented metrics, existing partner claims, booking integrations, or guaranteed repair outcomes.
- No claim that every guide or generated result works offline; demonstrate the installable PWA without promising uncached content.
- No new application features or changes to the public site.

## Approaches considered

1. **Extend the branded motion demo with a live talk track (chosen)** — reuse the established 16:9 Vitni visual identity, actual repair assets, product copy, and a time-coded speaking script. This preserves the user’s voice while letting the visuals show the product clearly.
2. **Add generated voiceover** — creates a self-contained video, but the user would not be speaking during the presentation and the synthetic voice could feel detached from the hackathon pitch.
3. **Record the app walkthrough directly** — highly authentic, but the small interface and browser details would make a two-minute product-and-roadmap story harder to stage cleanly.

The user selected a live talk track. The 10-second teaser remains a separate short asset.

## Format and motion direction

- 1920×1080, 16:9, 30 fps, H.264 MP4, target duration 110 seconds (1:50), with a restrained original music bed low enough for live speech.
- English throughout, matching the current app and the user's pitch language.
- Keep the existing warm paper, forest-green, lime, coral, and ligne-claire palette.
- Use intentional motion to explain the product: draw a path from photo to guide; reveal steps in order; transition the responsive web view into a phone/PWA view; let map pins and partner types connect into a Paris-first roadmap.
- Use short ease-out entrances (`cubic-bezier(0.23, 1, 0.32, 1)`) and smoother on-screen moves (`cubic-bezier(0.77, 0, 0.175, 1)`). Keep text and repair instructions settled while they are being read.
- Captions and visual labels should communicate the key beats without relying on audio.

## Storyboard and live talk track

| Time | Visual beat | Talk track |
| --- | --- | --- |
| 0:00–0:15 | Vitni arrives; quick photo-led glimpse of a bike, window, and seam. Title: “Keep good things going.” | “Most useful things don’t need replacing. The hard part is knowing what’s safe to try: a slipped bike chain, a loose window hinge, or a seam coming apart. Meet Vitni, your repair sidekick.” |
| 0:15–0:28 | Demo card: repair photo plus description; the result resolves into a likely issue with safety/tool cues. | “Add a photo and a few words—or just describe it. Vitni suggests the likely issue, a safe route, and tools or parts to check.” |
| 0:28–0:50 | “Reseat a slipped chain” guide. Four actions reveal in sequence, ending on the safety stop sign. | “For a slipped chain, pull the derailleur forward. Seat the chain on the front ring and rear cog. Turn the pedal backwards by hand. If it’s bent or keeps slipping, stop and ask a bike repairer.” |
| 0:50–1:02 | Illustrated guide cards for bikes, home, and clothing; cards connect back to the library. | “Follow illustrated steps and safety notes, then browse guides for bikes, home, clothes and everyday objects. Useful fixes can grow a shared library.” |
| 1:02–1:13 | Vitni icon moves from a phone home screen into the standalone responsive guide view. | “Install the responsive web app to your phone’s home screen and keep the guide close while you work.” |
| 1:13–1:24 | Paris community map; repair-café and workshop pins open a local listing. | “Need another pair of hands? Use the Paris map to discover repair cafés and local workshops.” |
| 1:24–1:40 | Roadmap labels appear: repair cafés, ateliers/repairers, parts shops. Paris is the first connected cluster. | “We’re looking for Paris partners: repair cafés, ateliers, bike repairers and parts shops, connecting people with hands-on help and the right replacement pieces.” |
| 1:40–1:50 | Paris route extends to unlabeled city nodes; Vitni end card and invitation. | “We’ll start in Paris, learn with partners, then grow city by city. Repair café, atelier or parts shop? Let’s talk.” |

Estimated script length: about 194 words. The 110-second timeline leaves pauses for the demo and transitions while remaining below the two-minute cap.

## Product truth and visual calls

- Use the exact current chain-repair steps from `site-data.js`; do not invent extra instructions.
- Show the current repair request pattern (photo + description, no required category) and the actual guide library categories.
- Present the PWA as installable and responsive. Avoid an offline promise in the pitch.
- Use an illustrative Paris neighborhood map treatment with the site’s community labels; it is a visual representation, not a precise navigational map.
- Make the roadmap a clear future step: seek café, atelier, repairer, and parts-shop partners in Paris; learn from the local pilot; then explore opening more cities.

## Deliverables

- `vitni-pitch-110s.mp4`, with the rendered motion design and low-level original music bed.
- A time-coded live talk track and scene notes in Markdown.
- Editable renderer, included source assets, poster, and contact sheet in `marketing/videos/vitni-pitch/`.
- Keep `marketing/videos/vitni-intro/vitni-intro-10s.mp4` unchanged as the short teaser.

## Approval

This design adds the requested product demo, live talk track, and Paris-first partnership roadmap to the existing short teaser. Rendering starts after the user approves this design.
