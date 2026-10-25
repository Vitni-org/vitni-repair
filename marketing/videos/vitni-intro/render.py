#!/usr/bin/env python3
"""Render the Vitni ten-second product intro from local project assets."""

from __future__ import annotations

import math
import shutil
import subprocess
import wave
from array import array
from functools import lru_cache
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont, ImageOps


ROOT = Path(__file__).resolve().parents[3]
OUT = Path(__file__).resolve().parent
ASSETS = OUT / "assets"
FRAMES = OUT / "frames"
WIDTH, HEIGHT, FPS, DURATION = 1920, 1080, 30, 10
FRAME_COUNT = FPS * DURATION

PAPER = "#f6f7f2"
INK = "#152421"
GREEN = "#194c42"
GREEN_DARK = "#103b34"
LIME = "#d9ef4b"
CORAL = "#e96955"
CREAM = "#e8e3d9"
WHITE = "#fffefa"
MUTED = "#5d6d66"
LINE = "#cbd2c8"
PALE_GREEN = "#e8f0d5"
PALE_CORAL = "#fff1eb"

MANROPE = ASSETS / "manrope-latin.woff2"
DM_MONO = ASSETS / "dm-mono-latin.woff2"


@lru_cache(maxsize=64)
def font(size: int, weight: int = 500, mono: bool = False) -> ImageFont.FreeTypeFont:
    path = DM_MONO if mono else MANROPE
    result = ImageFont.truetype(str(path), size)
    if not mono:
        result.set_variation_by_axes([weight])
    return result


def clamp(value: float, minimum: float = 0, maximum: float = 1) -> float:
    return max(minimum, min(maximum, value))


def ease_out(value: float) -> float:
    value = clamp(value)
    return 1 - (1 - value) ** 3


def ease_in_out(value: float) -> float:
    value = clamp(value)
    return 3 * value * value - 2 * value * value * value


def lerp(start: float, end: float, amount: float) -> float:
    return start + (end - start) * amount


def rounded(draw: ImageDraw.ImageDraw, box: tuple[int, int, int, int], radius: int, fill: str, outline: str | None = None, width: int = 2) -> None:
    draw.rounded_rectangle(box, radius=radius, fill=fill, outline=outline, width=width)


def txt(draw: ImageDraw.ImageDraw, xy: tuple[int, int], value: str, size: int, color: str = INK, weight: int = 500, mono: bool = False, anchor: str = "la", spacing: int = 8) -> None:
    draw.multiline_text(xy, value, font=font(size, weight, mono), fill=color, anchor=anchor, spacing=spacing)


def measure(value: str, size: int, weight: int = 500, mono: bool = False) -> tuple[int, int]:
    bounds = font(size, weight, mono).getbbox(value)
    return bounds[2] - bounds[0], bounds[3] - bounds[1]


def paste_cover(canvas: Image.Image, image: Image.Image, box: tuple[int, int, int, int], center: tuple[float, float] = (0.5, 0.5), radius: int = 24, border: str | None = None) -> None:
    x1, y1, x2, y2 = box
    size = (x2 - x1, y2 - y1)
    crop = ImageOps.fit(image.convert("RGB"), size, method=Image.Resampling.LANCZOS, centering=center)
    mask = Image.new("L", size, 0)
    ImageDraw.Draw(mask).rounded_rectangle((0, 0, size[0] - 1, size[1] - 1), radius=radius, fill=255)
    canvas.paste(crop, (x1, y1), mask)
    if border:
        ImageDraw.Draw(canvas).rounded_rectangle(box, radius=radius, outline=border, width=3)


def contain(image: Image.Image, size: tuple[int, int]) -> Image.Image:
    return ImageOps.contain(image.convert("RGBA"), size, method=Image.Resampling.LANCZOS)


def star(draw: ImageDraw.ImageDraw, cx: int, cy: int, radius: int, color: str, outline: str = GREEN) -> None:
    points = []
    for index in range(8):
        angle = -math.pi / 2 + index * math.pi / 4
        length = radius if index % 2 == 0 else radius * 0.31
        points.append((cx + math.cos(angle) * length, cy + math.sin(angle) * length))
    draw.polygon(points, fill=color, outline=outline)
    draw.line(points + [points[0]], fill=outline, width=4, joint="curve")


def brand(canvas: Image.Image, t: float) -> None:
    draw = ImageDraw.Draw(canvas)
    mark = Image.open(ASSETS / "vitni-head.png").convert("RGBA").resize((68, 68), Image.Resampling.LANCZOS)
    canvas.alpha_composite(mark, (74, 30)) if canvas.mode == "RGBA" else canvas.paste(mark, (74, 30), mark)
    txt(draw, (156, 39), "Vitni", 37, INK, 800)
    txt(draw, (157, 79), "YOUR REPAIR SIDEKICK", 15, GREEN, 400, mono=True)
    draw.line((72, 124, WIDTH - 72, 124), fill=LINE, width=2)

    # Persistent playback rail makes the six fast beats feel like one short story.
    rail_y = HEIGHT - 34
    draw.rounded_rectangle((74, rail_y, WIDTH - 74, rail_y + 8), radius=4, fill=LINE)
    end_x = int(74 + (WIDTH - 148) * clamp(t / DURATION))
    draw.rounded_rectangle((74, rail_y, max(82, end_x), rail_y + 8), radius=4, fill=LIME)


def background(t: float) -> Image.Image:
    canvas = Image.new("RGBA", (WIDTH, HEIGHT), PAPER)
    draw = ImageDraw.Draw(canvas)
    # Quiet paper-like geometry and orbit marks keep the app's existing visual tone.
    for x, y, radius in [(1710, 230, 130), (1780, 340, 34), (142, 920, 76), (1630, 900, 45)]:
        draw.ellipse((x - radius, y - radius, x + radius, y + radius), outline="#e2e6dc", width=2)
    draw.ellipse((1618, 142, 1858, 382), outline="#e5eadd", width=2)
    draw.ellipse((1644, 168, 1832, 356), outline="#e2e8d9", width=2)
    brand(canvas, t)
    return canvas


def section_label(draw: ImageDraw.ImageDraw, x: int, y: int, value: str) -> None:
    dot_radius = 8
    draw.ellipse((x, y + 9, x + dot_radius * 2, y + 9 + dot_radius * 2), fill=LIME)
    txt(draw, (x + 30, y), value.upper(), 20, GREEN, 500, mono=True)


def draw_arrow(draw: ImageDraw.ImageDraw, start: tuple[int, int], end: tuple[int, int], color: str = GREEN, width: int = 7) -> None:
    draw.line([start, end], fill=color, width=width)
    angle = math.atan2(end[1] - start[1], end[0] - start[0])
    head_len = 24
    left = (end[0] - head_len * math.cos(angle - math.pi / 6), end[1] - head_len * math.sin(angle - math.pi / 6))
    right = (end[0] - head_len * math.cos(angle + math.pi / 6), end[1] - head_len * math.sin(angle + math.pi / 6))
    draw.polygon([end, left, right], fill=color)


def transition_mark(canvas: Image.Image, elapsed: float, first: bool = False) -> None:
    if first or elapsed > 0.24:
        return
    draw = ImageDraw.Draw(canvas)
    p = ease_out(elapsed / 0.24)
    x = int(lerp(-520, WIDTH + 520, p))
    draw.polygon([(x - 200, 124), (x + 60, 124), (x + 420, HEIGHT - 124), (x + 160, HEIGHT - 124)], fill=LIME)
    draw.polygon([(x - 140, 124), (x - 50, 124), (x + 310, HEIGHT - 124), (x + 220, HEIGHT - 124)], fill=CORAL)


def scene_intro(t: float, elapsed: float) -> Image.Image:
    canvas = background(t)
    draw = ImageDraw.Draw(canvas)
    p = ease_out(elapsed / 0.36)
    section_label(draw, 90, 195, "Meet Vitni · repair sidekick")
    txt(draw, (90, int(310 + (1 - p) * 48)), "Keep good things", 91, INK, 800)
    txt(draw, (95, int(412 + (1 - p) * 48)), "going.", 105, GREEN, 700)
    txt(draw, (101, 584), "A photo. A few words. A safe next step.", 35, MUTED, 500)
    rounded(draw, (95, 704, 670, 788), 18, GREEN, GREEN, 2)
    txt(draw, (132, 726), "GET MY REPAIR STEPS", 24, WHITE, 800)
    draw_arrow(draw, (556, 746), (620, 746), LIME, 5)

    # Mascot bounce, slight tilt and comic glints.
    mascot = Image.open(ASSETS / "vitni-mascot.png").convert("RGBA")
    target_h = int(720 * (0.86 + 0.14 * p))
    target_w = int(target_h * mascot.width / mascot.height)
    mascot = mascot.resize((target_w, target_h), Image.Resampling.LANCZOS)
    angle = math.sin(elapsed * 8.0) * 2.0
    mascot = mascot.rotate(angle, resample=Image.Resampling.BICUBIC, expand=True)
    x = 1240 + int((1 - p) * 130)
    y = 225 + int(6 * math.sin(elapsed * 8.0))
    canvas.alpha_composite(mascot, (x, y))
    draw = ImageDraw.Draw(canvas)
    star(draw, 1210, 395, 30, LIME)
    star(draw, 1736, 303, 21, CORAL)
    txt(draw, (1490, 918), "FIX · WEAR · RIDE", 18, GREEN, 500, mono=True, anchor="mm")
    return canvas


def scene_photo(t: float, elapsed: float) -> Image.Image:
    canvas = background(t)
    draw = ImageDraw.Draw(canvas)
    section_label(draw, 90, 178, "01 · Show Vitni what changed")
    p = ease_out(elapsed / 0.32)
    txt(draw, (90, int(250 + (1 - p) * 38)), "A photo. A few words.", 77, INK, 800)
    rounded(draw, (82, 374, 1838, 914), 34, WHITE, LINE, 3)

    photo = Image.open(ASSETS / "bike-chain-story.jpg")
    shift = 0.45 + 0.08 * math.sin(elapsed * 2.6)
    paste_cover(canvas, photo, (116, 408, 890, 846), center=(shift, 0.5), radius=24, border=LINE)
    draw = ImageDraw.Draw(canvas)
    txt(draw, (945, 424), "WHAT HAPPENED TO IT?", 18, GREEN, 500, mono=True)
    txt(draw, (945, 485), "My bike chain slips\nwhen I change gear.", 45, INK, 700, spacing=11)
    rounded(draw, (945, 645, 1716, 726), 18, PAPER, LINE, 2)
    # Uploaded-photo chip.
    draw.ellipse((972, 665, 1008, 701), fill=PALE_GREEN)
    txt(draw, (1025, 667), "Bike-chain photo attached", 21, MUTED, 500)
    rounded(draw, (945, 758, 1490, 836), 16, GREEN, GREEN, 2)
    txt(draw, (976, 781), "Get my repair steps", 23, WHITE, 800)
    draw_arrow(draw, (1400, 798), (1455, 798), LIME, 5)
    rounded(draw, (1508, 758, 1716, 836), 16, PALE_GREEN, None)
    txt(draw, (1612, 798), "NO CATEGORY", 15, GREEN, 500, mono=True, anchor="mm")
    return canvas


def draw_step_icon(draw: ImageDraw.ImageDraw, cx: int, cy: int, kind: int) -> None:
    draw.ellipse((cx - 42, cy - 42, cx + 42, cy + 42), fill=[PALE_GREEN, PALE_CORAL, "#dcebe5", PALE_CORAL][kind])
    if kind == 0:
        # Derailleur / slack line.
        draw.arc((cx - 23, cy - 20, cx + 25, cy + 23), start=190, end=345, fill=GREEN, width=6)
        draw.line((cx - 4, cy + 14, cx + 22, cy - 12), fill=GREEN, width=6)
        draw.ellipse((cx + 17, cy - 17, cx + 29, cy - 5), fill=CORAL)
    elif kind == 1:
        # Linked chain loops.
        draw.rounded_rectangle((cx - 28, cy - 8, cx + 5, cy + 8), radius=8, outline=GREEN, width=6)
        draw.rounded_rectangle((cx - 5, cy - 8, cx + 28, cy + 8), radius=8, outline=GREEN, width=6)
    elif kind == 2:
        # A hand-turned arrow.
        draw.arc((cx - 24, cy - 24, cx + 24, cy + 24), start=35, end=322, fill=GREEN, width=6)
        draw.polygon([(cx + 20, cy - 21), (cx + 32, cy - 24), (cx + 26, cy - 9)], fill=GREEN)
    else:
        draw.polygon([(cx, cy - 27), (cx + 27, cy + 24), (cx - 27, cy + 24)], fill=CORAL, outline=GREEN)
        draw.line((cx, cy - 10, cx, cy + 7), fill=WHITE, width=5)
        draw.ellipse((cx - 3, cy + 13, cx + 3, cy + 19), fill=WHITE)


def scene_steps(t: float, elapsed: float) -> Image.Image:
    canvas = background(t)
    draw = ImageDraw.Draw(canvas)
    section_label(draw, 90, 176, "02 · A guide that moves at your pace")
    txt(draw, (90, 242), "Reseat a slipped chain", 70, INK, 800)
    rounded(draw, (1455, 256, 1760, 324), 18, PALE_GREEN, None)
    txt(draw, (1608, 289), "4 STEPS · 5 MIN", 18, GREEN, 500, mono=True, anchor="mm")

    steps = [
        ("Make slack", "Pull the derailleur\narm forward."),
        ("Seat the chain", "Front ring and\nrear cog."),
        ("Turn by hand", "Backpedal slowly\nto settle it."),
        ("Stop if bent", "Ask a bike shop if\nit keeps slipping."),
    ]
    left, top, width, gap, height = 84, 383, 412, 30, 452
    for index, (title, copy) in enumerate(steps):
        raw = (elapsed - index * 0.24) / 0.36
        p = ease_out(raw)
        if raw < 0:
            continue
        x = left + index * (width + gap)
        y = top + int((1 - p) * 70)
        card_fill = PALE_CORAL if index == 3 else WHITE
        outline = CORAL if index == 3 else LINE
        rounded(draw, (x, y, x + width, y + height), 26, card_fill, outline, 3)
        badge = LIME if index < 3 else CORAL
        draw.ellipse((x + 28, y + 27, x + 92, y + 91), fill=badge)
        txt(draw, (x + 60, y + 59), f"0{index + 1}", 21, GREEN_DARK if index < 3 else WHITE, 500, mono=True, anchor="mm")
        draw_step_icon(draw, x + 335, y + 66, index)
        txt(draw, (x + 30, y + 142), title, 30, INK, 800)
        txt(draw, (x + 30, y + 201), copy, 23, MUTED, 500, spacing=12)
        if index < 3:
            draw_arrow(draw, (x + 28, y + 374), (x + 150, y + 374), GREEN, 5)
        else:
            rounded(draw, (x + 28, y + 350, x + width - 28, y + 405), 12, CORAL, None)
            txt(draw, (x + width // 2, y + 378), "SAFETY FIRST", 15, WHITE, 500, mono=True, anchor="mm")

    txt(draw, (90, 886), "Clear actions, useful tools, and a clear stop sign.", 26, GREEN, 600)
    return canvas


def draw_phone(draw: ImageDraw.ImageDraw, canvas: Image.Image, elapsed: float) -> None:
    p = ease_out(elapsed / 0.38)
    x = int(1190 + (1 - p) * 170)
    y = 225
    width, height = 515, 760
    rounded(draw, (x - 13, y - 12, x + width + 13, y + height + 12), 64, INK, INK, 2)
    rounded(draw, (x, y, x + width, y + height), 55, PAPER, None)
    # Standalone app viewport: no browser chrome once Vitni has been added.
    txt(draw, (x + 34, y + 23), "9:41", 16, INK, 700)
    draw.rounded_rectangle((x + width - 90, y + 28, x + width - 30, y + 42), radius=6, fill=GREEN)
    draw.line((x + 36, y + 72, x + width - 36, y + 72), fill=LINE, width=2)
    mark = Image.open(ASSETS / "vitni-head.png").convert("RGBA").resize((40, 40), Image.Resampling.LANCZOS)
    canvas.alpha_composite(mark, (x + 30, y + 88))
    txt(draw, (x + 84, y + 93), "Vitni", 26, INK, 800)
    txt(draw, (x + 28, y + 171), "Your repair guide", 17, GREEN, 500, mono=True)
    txt(draw, (x + 28, y + 211), "Patch a flat tyre", 34, INK, 800)
    txt(draw, (x + 29, y + 258), "Step 2 of 4", 17, MUTED, 500)
    rounded(draw, (x + 28, y + 300, x + width - 28, y + 309), 4, LINE, None)
    rounded(draw, (x + 28, y + 300, x + 28 + int((width - 56) * 0.52), y + 309), 4, LIME, None)
    rounded(draw, (x + 28, y + 341, x + width - 28, y + 562), 24, WHITE, LINE, 2)
    draw.ellipse((x + 56, y + 369, x + 108, y + 421), fill=PALE_GREEN)
    txt(draw, (x + 82, y + 395), "02", 17, GREEN, 500, mono=True, anchor="mm")
    txt(draw, (x + 126, y + 367), "Take out the tube", 21, INK, 700)
    txt(draw, (x + 56, y + 446), "Lift one tyre edge with\nlevers, then remove the tube.", 17, MUTED, 500, spacing=9)
    rounded(draw, (x + 28, y + 595, x + width - 28, y + 657), 16, GREEN, GREEN, 2)
    txt(draw, (x + width // 2, y + 627), "Continue the guide", 17, WHITE, 700, anchor="mm")
    rounded(draw, (x + width // 2 - 56, y + 721, x + width // 2 + 56, y + 727), 3, INK, None)


def scene_pwa(t: float, elapsed: float) -> Image.Image:
    canvas = background(t)
    draw = ImageDraw.Draw(canvas)
    section_label(draw, 90, 178, "03 · Take Vitni with you")
    txt(draw, (90, 245), "Your repair sidekick,", 67, INK, 800)
    txt(draw, (90, 324), "on your home screen.", 67, GREEN, 800)
    txt(draw, (95, 432), "Install the PWA. Open a guide like an app.", 25, MUTED, 500)

    # Home-screen view with the Vitni app icon and a native-feeling install card.
    rounded(draw, (118, 553, 813, 877), 34, CREAM, LINE, 3)
    txt(draw, (154, 591), "YOUR HOME SCREEN", 17, GREEN, 500, mono=True)
    icons = [("Mail", "#e7f0ec"), ("Photos", "#fff1eb"), ("Vitni", LIME), ("Maps", "#e8f0d5")]
    for index, (name, color) in enumerate(icons):
        x = 164 + index * 146
        rounded(draw, (x, 650, x + 83, 733), 21, color, None)
        if name == "Vitni":
            mark = Image.open(ASSETS / "vitni-head.png").convert("RGBA").resize((82, 82), Image.Resampling.LANCZOS)
            canvas.alpha_composite(mark, (x, 650))
        else:
            star(draw, x + 42, 690, 25, WHITE if name != "Maps" else LIME, GREEN)
        txt(draw, (x + 41, 751), name, 15, INK, 500, anchor="mm")
    rounded(draw, (153, 796, 776, 848), 13, WHITE, LINE, 2)
    txt(draw, (180, 811), "Vitni is ready to open", 17, GREEN, 600)

    # Home-screen install sheet, which moves up before the standalone phone arrives.
    sheet_y = int(lerp(944, 745, ease_out(elapsed / 0.6)))
    rounded(draw, (841, sheet_y, 1100, sheet_y + 144), 23, WHITE, LINE, 2)
    txt(draw, (866, sheet_y + 19), "Add to Home Screen", 18, INK, 700)
    txt(draw, (867, sheet_y + 58), "Vitni · repair guides", 16, MUTED, 500)
    rounded(draw, (1012, sheet_y + 97, 1072, sheet_y + 129), 9, GREEN, None)
    txt(draw, (1042, sheet_y + 113), "Add", 14, WHITE, 700, anchor="mm")

    draw_phone(draw, canvas, elapsed)
    draw_arrow(draw, (805, 507), (1125, 507), CORAL, 8)
    return canvas


def scene_guides(t: float, elapsed: float) -> Image.Image:
    canvas = background(t)
    draw = ImageDraw.Draw(canvas)
    section_label(draw, 90, 178, "04 · Browse the repair library")
    txt(draw, (90, 247), "Step-by-step guides for everyday fixes.", 65, INK, 800)
    cards = [
        ("BIKE", "Patch a flat tyre", "15 min", ASSETS / "bike-flat.webp", 0.46),
        ("HOME", "Tighten a window hinge", "15 min", ASSETS / "window-hinge-story.jpg", 0.5),
        ("CLOTHES", "Repair a torn seam", "20 min", ASSETS / "denim-seam-story.jpg", 0.55),
    ]
    lefts = [93, 697, 1301]
    for index, (category, title, duration, path, focus) in enumerate(cards):
        raw = (elapsed - index * 0.16) / 0.42
        p = ease_out(raw)
        if raw < 0:
            continue
        x = int(lefts[index] + (1 - p) * (125 if index != 1 else -125))
        y = 379 + int((1 - p) * 30)
        width, height = 524, 530
        rounded(draw, (x, y, x + width, y + height), 25, WHITE, LINE, 3)
        image = Image.open(path)
        paste_cover(canvas, image, (x + 14, y + 14, x + width - 14, y + 302), center=(focus, 0.5), radius=18)
        draw = ImageDraw.Draw(canvas)
        txt(draw, (x + 30, y + 328), category, 16, GREEN, 500, mono=True)
        title_size = 28 if index == 1 else 32
        txt(draw, (x + 30, y + 365), title, title_size, INK, 800)
        txt(draw, (x + 30, y + 420), f"Illustrated guide · {duration}", 18, MUTED, 500)
        draw_arrow(draw, (x + 30, y + 482), (x + 110, y + 482), GREEN, 5)
    rounded(draw, (1428, 913, 1795, 968), 13, GREEN, None)
    txt(draw, (1612, 940), "Browse every guide  →", 19, WHITE, 700, anchor="mm")
    return canvas


def scene_community(t: float, elapsed: float) -> Image.Image:
    canvas = background(t)
    draw = ImageDraw.Draw(canvas)
    section_label(draw, 90, 178, "05 · Community help in Paris")
    txt(draw, (90, 245), "Good fixes happen together.", 67, INK, 800)
    txt(draw, (95, 333), "Find a repair café or local workshop nearby.", 26, MUTED, 500)

    # Stylized neighborhood map: it suggests discovery without fabricating street data.
    map_box = (92, 439, 1022, 911)
    rounded(draw, map_box, 27, CREAM, LINE, 3)
    mx1, my1, mx2, my2 = map_box
    for index in range(8):
        x = mx1 + 80 + index * 118
        draw.line((x, my1 + 24, x - 95, my2 - 24), fill="#f8f7f1", width=18)
    for index in range(5):
        y = my1 + 65 + index * 83
        draw.line((mx1 + 22, y, mx2 - 20, y + (index % 2) * 25), fill="#faf9f3", width=17)
    draw.line((mx1 + 84, my1 + 410, mx1 + 410, my1 + 100), fill="#d3ddc7", width=9)
    draw.line((mx1 + 430, my1 + 440, mx1 + 785, my1 + 60), fill="#d3ddc7", width=9)
    txt(draw, (mx1 + 38, my1 + 30), "PARIS", 18, GREEN, 500, mono=True)
    pins = [(mx1 + 284, my1 + 194), (mx1 + 608, my1 + 292), (mx1 + 785, my1 + 151)]
    for index, (px, py) in enumerate(pins):
        pulse = 1 + 0.08 * math.sin(elapsed * 8 + index)
        radius = int(19 * pulse)
        draw.ellipse((px - radius * 2, py - radius * 2, px + radius * 2, py + radius * 2), fill="#d9ef4b")
        draw.ellipse((px - radius, py - radius, px + radius, py + radius), fill=CORAL, outline=GREEN, width=4)
    rounded(draw, (mx1 + 447, my1 + 207, mx1 + 836, my1 + 287), 15, WHITE, LINE, 2)
    txt(draw, (mx1 + 469, my1 + 222), "Repair Café · Paris 10e", 20, INK, 700)
    txt(draw, (mx1 + 470, my1 + 253), "Meet a neighbor. Share a tool.", 15, MUTED, 500)

    # Final brand card keeps community visible while the CTA lands.
    rounded(draw, (1090, 439, 1829, 911), 28, GREEN, GREEN, 2)
    mascot = Image.open(ASSETS / "vitni-mascot.png").convert("RGBA")
    mascot = contain(mascot, (315, 370))
    bounce = int(9 * math.sin(elapsed * 8))
    canvas.alpha_composite(mascot, (1308, 467 + bounce))
    draw = ImageDraw.Draw(canvas)
    star(draw, 1248, 542, 22, LIME)
    star(draw, 1670, 545, 19, CORAL)
    txt(draw, (1459, 840), "Meet Vitni", 39, WHITE, 800, anchor="mm")
    txt(draw, (1459, 888), "vitni.cc", 21, LIME, 500, mono=True, anchor="mm")
    rounded(draw, (92, 937, 730, 995), 14, WHITE, LINE, 2)
    txt(draw, (128, 954), "PHOTO  →  SAFE STEPS  →  LOCAL HELP", 17, GREEN, 500, mono=True)
    return canvas


SCENES = [
    (0.0, 1.45, scene_intro),
    (1.45, 3.1, scene_photo),
    (3.1, 5.2, scene_steps),
    (5.2, 6.95, scene_pwa),
    (6.95, 8.38, scene_guides),
    (8.38, 10.0, scene_community),
]


def render_frame(t: float) -> Image.Image:
    index = len(SCENES) - 1
    for i, (start, end, _) in enumerate(SCENES):
        if start <= t < end:
            index = i
            break
    start, _, draw_scene = SCENES[index]
    elapsed = t - start
    canvas = draw_scene(t, elapsed)
    transition_mark(canvas, elapsed, first=index == 0)
    return canvas.convert("RGB")


def make_audio(path: Path) -> None:
    sample_rate = 48000
    samples = sample_rate * DURATION
    notes = [
        (0.08, 523.25), (0.48, 659.25), (0.93, 783.99),
        (1.52, 587.33), (1.96, 698.46), (2.38, 783.99),
        (3.12, 659.25), (3.58, 783.99), (4.05, 880.00), (4.53, 698.46),
        (5.22, 523.25), (5.68, 659.25), (6.15, 783.99),
        (6.98, 587.33), (7.40, 698.46), (7.83, 880.00),
        (8.42, 659.25), (8.86, 783.99), (9.28, 1046.50),
    ]
    output = array("h")
    two_pi = 2 * math.pi
    for i in range(samples):
        t = i / sample_rate
        fade_in = min(1.0, t / 0.25)
        fade_out = min(1.0, (DURATION - t) / 0.45)
        pad = (math.sin(two_pi * 130.81 * t) + math.sin(two_pi * 164.81 * t) + math.sin(two_pi * 196.0 * t)) * 0.009
        pluck = 0.0
        for start, frequency in notes:
            dt = t - start
            if 0 <= dt <= 0.48:
                envelope = math.exp(-dt * 8.5)
                pluck += envelope * (math.sin(two_pi * frequency * dt) + 0.28 * math.sin(two_pi * frequency * 2.01 * dt)) * 0.035
        signal = max(-0.82, min(0.82, (pad + pluck) * fade_in * fade_out))
        sample = int(signal * 32767)
        output.append(sample)
        output.append(sample)
    with wave.open(str(path), "wb") as wav:
        wav.setnchannels(2)
        wav.setsampwidth(2)
        wav.setframerate(sample_rate)
        wav.writeframes(output.tobytes())


def make_contact_sheet() -> None:
    times = [0.62, 2.1, 4.25, 5.9, 7.55, 9.35]
    width, height = 640, 360
    sheet = Image.new("RGB", (width * 3, (height + 34) * 2), PAPER)
    draw = ImageDraw.Draw(sheet)
    for index, t in enumerate(times):
        frame_index = min(FRAME_COUNT - 1, int(t * FPS))
        frame = Image.open(FRAMES / f"{frame_index:04d}.jpg").convert("RGB")
        thumb = frame.resize((width, height), Image.Resampling.LANCZOS)
        x = (index % 3) * width
        y = (index // 3) * (height + 34)
        sheet.paste(thumb, (x, y))
        txt(draw, (x + 14, y + height + 5), f"{t:0.1f}s", 18, GREEN, 500, mono=True)
    sheet.save(OUT / "contact-sheet.png", optimize=True)
    Image.open(FRAMES / f"{int(0.6 * FPS):04d}.jpg").convert("RGB").save(OUT / "poster.png", optimize=True)


def main() -> None:
    FRAMES.mkdir(parents=True, exist_ok=True)
    for old_frame in FRAMES.glob("*.jpg"):
        old_frame.unlink()

    for frame_index in range(FRAME_COUNT):
        t = frame_index / FPS
        image = render_frame(t)
        image.save(FRAMES / f"{frame_index:04d}.jpg", quality=94, subsampling=0, optimize=True)
        if frame_index % 60 == 0:
            print(f"Rendered {frame_index:03d}/{FRAME_COUNT} frames")

    audio_path = OUT / "vitni-original-soundtrack.wav"
    make_audio(audio_path)
    output_path = OUT / "vitni-intro-10s.mp4"
    ffmpeg = shutil.which("ffmpeg")
    if not ffmpeg:
        raise SystemExit("ffmpeg is required to encode the video")
    subprocess.run(
        [
            ffmpeg, "-y", "-hide_banner", "-loglevel", "warning",
            "-framerate", str(FPS), "-i", str(FRAMES / "%04d.jpg"),
            "-i", str(audio_path), "-frames:v", str(FRAME_COUNT), "-t", str(DURATION),
            "-c:v", "libx264", "-preset", "medium", "-crf", "18", "-pix_fmt", "yuv420p",
            "-c:a", "aac", "-b:a", "192k", "-movflags", "+faststart", str(output_path),
        ],
        check=True,
    )
    make_contact_sheet()
    shutil.rmtree(FRAMES)
    print(f"Video written to {output_path}")


if __name__ == "__main__":
    main()
