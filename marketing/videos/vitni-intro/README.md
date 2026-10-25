# Vitni · 10-second product intro

**Output:** `vitni-intro-10s.mp4` · 1920×1080 · 16:9 · 30 fps · H.264 with an original, light synthetic music bed.

The silent-viewing story is carried by on-screen text. The video introduces Vitni, shows a photo-and-description repair request, demonstrates the four-step “Reseat a slipped chain” guide, moves the experience onto a phone as a PWA, previews bike/home/clothing guides, and closes on Paris repair-café support.

## Beat sheet

| Time | On-screen copy | Product moment |
| --- | --- | --- |
| 0.0–1.45 s | “Keep good things going.” | Vitni arrives as the repair sidekick. |
| 1.45–3.10 s | “A photo. A few words.” | Bike photo plus the description: “My bike chain slips when I change gear.” |
| 3.10–5.20 s | “Reseat a slipped chain” | Four actual guide actions appear in sequence, including the stop-safety note. |
| 5.20–6.95 s | “On your home screen.” | Add-to-home-screen prompt transforms into a standalone Vitni guide view. |
| 6.95–8.38 s | “Guides for everyday fixes.” | Bike, home, and clothing guide cards. |
| 8.38–10.00 s | “Good fixes happen together.” | Paris repair café discovery and Vitni end card. |

## Re-render

Requires Python 3, Pillow, and `ffmpeg`. The included fonts and image assets make this composition independent of the app runtime.

```sh
python3 render.py
```

The script writes `vitni-intro-10s.mp4`, `poster.png`, `contact-sheet.png`, and `vitni-original-soundtrack.wav`. Temporary frame files are used during rendering.

The Paris map in the composition is a stylized illustration for the marketing piece; the actual site opens Google Maps and lists community locations.
