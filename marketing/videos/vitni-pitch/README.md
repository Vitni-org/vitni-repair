# Vitni · 110-second pitch

**Video:** `vitni-pitch-110s.mp4` · **Format:** 1920×1080 · 16:9 · 30 fps · H.264 · 1:50.

The pitch uses deliberate comic-inspired motion to demonstrate Vitni’s photo-and-description repair flow, an actual four-step bicycle-chain guide, the bike/home/clothing guide library, the installable PWA, Paris repair-café discovery, and the next step of finding local repair partners before expanding to other cities.

The video is caption-led with an original, low-level music bed. Present it with the [time-coded English talk track](pitch-script.md); it has no generated narration. Paris partner cards are presented as a future opportunity, not as active partnerships. The map treatment is illustrative; the app’s community section links to Google Maps and lists Paris locations.

## Re-render

Requires Python 3, Pillow, and `ffmpeg`. Fonts and source photography are included under `assets/`.

```sh
python3 render_pitch.py
```

The renderer writes `vitni-pitch-110s.mp4`, `poster.png`, and `contact-sheet.png`; temporary frames and audio are removed after encoding.
