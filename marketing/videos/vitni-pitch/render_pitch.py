#!/usr/bin/env python3
"""Render the approved Vitni 110-second pitch with Pillow and ffmpeg."""

from __future__ import annotations

import math
import shutil
import subprocess
import wave
from array import array
from functools import lru_cache
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont, ImageOps


OUT = Path(__file__).resolve().parent
ASSETS = OUT / "assets"
FRAMES = OUT / "frames"
WIDTH, HEIGHT, FPS, DURATION = 1920, 1080, 30, 110
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

ASSET_FILES = {
    "mascot": "vitni-mascot.png",
    "mark": "vitni-head.png",
    "chain": "chain-off-test.jpg",
    "chain_story": "bike-chain-story.jpg",
    "flat": "bike-flat.webp",
    "window": "window-hinge-story.jpg",
    "seam": "denim-seam-story.jpg",
}
IMAGES = {key: Image.open(ASSETS / filename).convert("RGBA" if key in {"mascot", "mark"} else "RGB") for key, filename in ASSET_FILES.items()}
BASE = None


@lru_cache(maxsize=96)
def font(size: int, weight: int = 500, mono: bool = False) -> ImageFont.FreeTypeFont:
    font_path = ASSETS / ("dm-mono-latin.woff2" if mono else "manrope-latin.woff2")
    result = ImageFont.truetype(str(font_path), size)
    if not mono:
        result.set_variation_by_axes([weight])
    return result


def bezier_component(t: float, p1: float, p2: float) -> float:
    return 3 * (1 - t) ** 2 * t * p1 + 3 * (1 - t) * t * t * p2 + t**3


def cubic_bezier(x: float, x1: float, y1: float, x2: float, y2: float) -> float:
    """Evaluate a standard cubic-bezier easing by solving its x coordinate."""
    x = max(0.0, min(1.0, x))
    low, high = 0.0, 1.0
    for _ in range(18):
        t = (low + high) / 2
        if bezier_component(t, x1, x2) < x:
            low = t
        else:
            high = t
    return bezier_component((low + high) / 2, y1, y2)


def ease_out(value: float) -> float:
    return cubic_bezier(value, 0.23, 1.0, 0.32, 1.0)


def ease_in_out(value: float) -> float:
    return cubic_bezier(value, 0.77, 0.0, 0.175, 1.0)


def clamp(value: float, minimum: float = 0, maximum: float = 1) -> float:
    return max(minimum, min(maximum, value))


def lerp(start: float, end: float, amount: float) -> float:
    return start + (end - start) * amount


def rounded(draw: ImageDraw.ImageDraw, box: tuple[int, int, int, int], radius: int, fill: str, outline: str | None = None, width: int = 2) -> None:
    draw.rounded_rectangle(box, radius=radius, fill=fill, outline=outline, width=width)


def txt(draw: ImageDraw.ImageDraw, xy: tuple[int, int], value: str, size: int, color: str = INK, weight: int = 500, mono: bool = False, anchor: str = "la", spacing: int = 9) -> None:
    draw.multiline_text(xy, value, font=font(size, weight, mono), fill=color, anchor=anchor, spacing=spacing)


def measure(value: str, size: int, weight: int = 500, mono: bool = False) -> tuple[int, int]:
    bounds = font(size, weight, mono).getbbox(value)
    return bounds[2] - bounds[0], bounds[3] - bounds[1]


@lru_cache(maxsize=128)
def cover(name: str, width: int, height: int, cx: float = 0.5, cy: float = 0.5) -> Image.Image:
    image = IMAGES[name].convert("RGB")
    return ImageOps.fit(image, (width, height), method=Image.Resampling.LANCZOS, centering=(cx, cy))


@lru_cache(maxsize=32)
def rounded_mask(width: int, height: int, radius: int) -> Image.Image:
    mask = Image.new("L", (width, height), 0)
    ImageDraw.Draw(mask).rounded_rectangle((0, 0, width - 1, height - 1), radius=radius, fill=255)
    return mask


def paste_cover(canvas: Image.Image, name: str, box: tuple[int, int, int, int], radius: int = 24, center: tuple[float, float] = (0.5, 0.5), border: str | None = None) -> None:
    x1, y1, x2, y2 = box
    width, height = x2 - x1, y2 - y1
    crop = cover(name, width, height, round(center[0], 3), round(center[1], 3))
    canvas.paste(crop, (x1, y1), rounded_mask(width, height, radius))
    if border:
        ImageDraw.Draw(canvas).rounded_rectangle(box, radius=radius, outline=border, width=3)


def paste_mascot(canvas: Image.Image, xy: tuple[int, int], size: tuple[int, int], angle: float = 0) -> None:
    mascot = IMAGES["mascot"].resize(size, Image.Resampling.LANCZOS)
    if angle:
        mascot = mascot.rotate(angle, resample=Image.Resampling.BICUBIC, expand=True)
    canvas.paste(mascot, xy, mascot)


def draw_star(draw: ImageDraw.ImageDraw, cx: int, cy: int, radius: int, color: str, outline: str = GREEN) -> None:
    points = []
    for index in range(8):
        angle = -math.pi / 2 + index * math.pi / 4
        length = radius if index % 2 == 0 else radius * 0.31
        points.append((cx + math.cos(angle) * length, cy + math.sin(angle) * length))
    draw.polygon(points, fill=color, outline=outline)
    draw.line(points + [points[0]], fill=outline, width=4, joint="curve")


def draw_arrow(draw: ImageDraw.ImageDraw, start: tuple[int, int], end: tuple[int, int], color: str = GREEN, width: int = 7) -> None:
    draw.line([start, end], fill=color, width=width)
    angle = math.atan2(end[1] - start[1], end[0] - start[0])
    head_len = 22
    left = (end[0] - head_len * math.cos(angle - math.pi / 6), end[1] - head_len * math.sin(angle - math.pi / 6))
    right = (end[0] - head_len * math.cos(angle + math.pi / 6), end[1] - head_len * math.sin(angle + math.pi / 6))
    draw.polygon([end, left, right], fill=color)


def line_progress(draw: ImageDraw.ImageDraw, start: tuple[int, int], end: tuple[int, int], progress: float, color: str = GREEN, width: int = 6) -> None:
    p = ease_in_out(progress)
    point = (int(lerp(start[0], end[0], p)), int(lerp(start[1], end[1], p)))
    draw.line([start, point], fill=color, width=width)


def build_background() -> Image.Image:
    canvas = Image.new("RGBA", (WIDTH, HEIGHT), PAPER)
    draw = ImageDraw.Draw(canvas)
    # Quiet concentric rings and registration marks echo Vitni's repair-lens motif.
    for x, y, radius in [(1710, 225, 135), (1780, 332, 36), (142, 925, 72), (1630, 900, 48)]:
        draw.ellipse((x - radius, y - radius, x + radius, y + radius), outline="#e2e6dc", width=2)
    draw.ellipse((1610, 132, 1860, 382), outline="#e5eadd", width=2)
    draw.ellipse((1640, 162, 1830, 352), outline="#e2e8d9", width=2)
    mark = IMAGES["mark"].resize((68, 68), Image.Resampling.LANCZOS)
    canvas.paste(mark, (72, 28), mark)
    draw = ImageDraw.Draw(canvas)
    txt(draw, (154, 34), "Vitni", 37, INK, 800)
    txt(draw, (155, 76), "YOUR REPAIR SIDEKICK", 15, GREEN, 400, mono=True)
    draw.line((72, 124, WIDTH - 72, 124), fill=LINE, width=2)
    return canvas


def base_frame(t: float) -> Image.Image:
    global BASE
    if BASE is None:
        BASE = build_background()
    canvas = BASE.copy()
    draw = ImageDraw.Draw(canvas)
    rail_y = HEIGHT - 32
    draw.rounded_rectangle((72, rail_y, WIDTH - 72, rail_y + 7), radius=4, fill=LINE)
    rail_x = int(72 + (WIDTH - 144) * clamp(t / DURATION))
    draw.rounded_rectangle((72, rail_y, max(78, rail_x), rail_y + 7), radius=4, fill=LIME)
    return canvas


def label(draw: ImageDraw.ImageDraw, x: int, y: int, value: str) -> None:
    draw.ellipse((x, y + 9, x + 16, y + 25), fill=LIME)
    txt(draw, (x + 30, y), value.upper(), 19, GREEN, 500, mono=True)


def title(draw: ImageDraw.ImageDraw, value: str, y: int = 228, size: int = 72, color: str = INK, reveal: float = 1.0, x: int = 92) -> None:
    y = int(y + (1 - ease_out(reveal)) * 50)
    txt(draw, (x, y), value, size, color, 800)


def section_wipe(canvas: Image.Image, elapsed: float, scene_index: int) -> None:
    """A short ink-and-lime stroke marks a new chapter without covering its copy."""
    if scene_index == 0 or elapsed >= 0.42:
        return
    p = ease_in_out(elapsed / 0.42)
    x = int(lerp(-390, WIDTH + 390, p))
    draw = ImageDraw.Draw(canvas)
    draw.polygon([(x - 160, 116), (x + 35, 116), (x + 89, 132), (x - 105, 132)], fill=LIME)
    draw.polygon([(x - 82, 116), (x - 40, 116), (x + 14, 132), (x - 28, 132)], fill=CORAL)


def scene_hook(t: float, elapsed: float) -> Image.Image:
    canvas = base_frame(t)
    draw = ImageDraw.Draw(canvas)
    p = ease_out(elapsed / 0.55)
    label(draw, 90, 185, "Small repairs · big second lives")
    txt(draw, (92, int(260 + (1 - p) * 54)), "Most useful things", 75, INK, 800)
    txt(draw, (96, int(348 + (1 - p) * 54)), "don’t need replacing.", 72, GREEN, 800)
    txt(draw, (100, 455), "They need one clear next step.", 34, MUTED, 500)
    rounded(draw, (94, 535, 686, 607), 18, GREEN, GREEN, 2)
    txt(draw, (125, 556), "Meet Vitni · your repair sidekick", 22, WHITE, 700)

    cards = [
        ("chain", "BIKE", (98, 680)),
        ("window", "HOME", (374, 680)),
        ("seam", "CLOTHES", (650, 680)),
    ]
    for i, (image_name, caption, (x, y)) in enumerate(cards):
        raw = (elapsed - 1.2 - i * 0.35) / 0.45
        if raw < 0:
            continue
        in_p = ease_out(raw)
        y = int(y + (1 - in_p) * 90)
        rounded(draw, (x, y, x + 250, y + 215), 20, WHITE, LINE, 2)
        paste_cover(canvas, image_name, (x + 8, y + 8, x + 242, y + 164), radius=15)
        draw = ImageDraw.Draw(canvas)
        txt(draw, (x + 20, y + 177), caption, 15, GREEN, 500, mono=True)

    # Vitni enters with a gentle bob and an orbiting spark; this is deliberate delight on the opening beat.
    bob = int(11 * math.sin(elapsed * 2.0))
    angle = math.sin(elapsed * 1.6) * 1.2
    paste_mascot(canvas, (1187, 225 + bob), (500, 562), angle)
    draw = ImageDraw.Draw(canvas)
    sparkle = int(28 + 4 * math.sin(elapsed * 2.5))
    draw_star(draw, 1255, 372, sparkle, LIME)
    draw_star(draw, 1665, 287, 20, CORAL)
    return canvas


def scene_photo(t: float, elapsed: float) -> Image.Image:
    canvas = base_frame(t)
    draw = ImageDraw.Draw(canvas)
    p = ease_out(elapsed / 0.4)
    label(draw, 90, 175, "01 · Show Vitni what changed")
    title(draw, "A photo. A few words.", 225, 72, INK, p)
    rounded(draw, (83, 341, 1838, 917), 32, WHITE, LINE, 3)
    paste_cover(canvas, "chain", (112, 370, 837, 850), 24, (0.51, 0.5), LINE)
    draw = ImageDraw.Draw(canvas)
    # A scanning corner brackets the fault, followed by a connecting line to Vitni's result.
    focus_p = ease_in_out(elapsed / 3.0)
    fx = int(432 + 52 * math.sin(focus_p * math.pi))
    draw.rounded_rectangle((fx - 95, 570, fx + 115, 760), radius=16, outline=LIME, width=7)
    draw.ellipse((fx + 78, 551, fx + 99, 572), fill=CORAL, outline=GREEN, width=3)

    rounded(draw, (884, 370, 1804, 850), 23, PAPER, LINE, 2)
    txt(draw, (928, 404), "WHAT HAPPENED TO IT?", 18, GREEN, 500, mono=True)
    rounded(draw, (922, 454, 1764, 585), 17, WHITE, LINE, 2)
    txt(draw, (953, 485), "My bike chain slips off when I\nchange gear.", 31, INK, 600, spacing=12)
    rounded(draw, (922, 618, 1764, 682), 14, PALE_GREEN, None)
    mark = IMAGES["mark"].resize((38, 38), Image.Resampling.LANCZOS)
    canvas.paste(mark, (940, 631), mark)
    draw = ImageDraw.Draw(canvas)
    txt(draw, (990, 638), "Photo attached · category not needed", 18, GREEN, 600)

    # Pointer-like focus cue traces the request into a likely next step.
    cursor_x = int(944 + 650 * ease_in_out(elapsed / 7.0))
    cursor_y = 720
    draw.ellipse((cursor_x - 16, cursor_y - 16, cursor_x + 16, cursor_y + 16), fill=LIME, outline=GREEN, width=3)
    draw.line((cursor_x + 2, cursor_y + 3, cursor_x + 12, cursor_y + 17), fill=GREEN, width=4)
    result_p = ease_out((elapsed - 7.0) / 0.4)
    if result_p > 0:
        result_x = int(930 + (1 - result_p) * 38)
        rounded(draw, (result_x, 718, result_x + 824, 817), 16, GREEN, None)
        txt(draw, (result_x + 24, 738), "LIKELY ISSUE", 14, LIME, 500, mono=True)
        txt(draw, (result_x + 24, 763), "Chain has slipped · safe next step ready", 22, WHITE, 700)
        star_x = result_x + 777
        draw_star(draw, star_x, 768, 19, LIME)
    return canvas


def step_icon(draw: ImageDraw.ImageDraw, cx: int, cy: int, kind: int, scale: float = 1.0) -> None:
    r = int(64 * scale)
    draw.ellipse((cx - r, cy - r, cx + r, cy + r), fill=[PALE_GREEN, PALE_CORAL, "#dcebe5", PALE_CORAL][kind])
    lw = max(3, int(6 * scale))
    if kind == 0:
        draw.arc((cx - 36, cy - 30, cx + 35, cy + 32), start=188, end=342, fill=GREEN, width=lw)
        draw.line((cx - 5, cy + 23, cx + 35, cy - 18), fill=GREEN, width=lw)
        draw.ellipse((cx + 25, cy - 28, cx + 40, cy - 13), fill=CORAL)
    elif kind == 1:
        draw.rounded_rectangle((cx - 42, cy - 10, cx + 7, cy + 10), radius=10, outline=GREEN, width=lw)
        draw.rounded_rectangle((cx - 8, cy - 10, cx + 42, cy + 10), radius=10, outline=GREEN, width=lw)
    elif kind == 2:
        draw.arc((cx - 36, cy - 36, cx + 36, cy + 36), start=38, end=322, fill=GREEN, width=lw)
        draw.polygon([(cx + 31, cy - 34), (cx + 51, cy - 36), (cx + 39, cy - 16)], fill=GREEN)
    else:
        draw.polygon([(cx, cy - 39), (cx + 40, cy + 35), (cx - 40, cy + 35)], fill=CORAL, outline=GREEN)
        draw.line((cx, cy - 15, cx, cy + 11), fill=WHITE, width=lw)
        draw.ellipse((cx - 4, cy + 19, cx + 4, cy + 27), fill=WHITE)


def scene_steps(t: float, elapsed: float) -> Image.Image:
    canvas = base_frame(t)
    draw = ImageDraw.Draw(canvas)
    label(draw, 90, 173, "02 · A clear route, one step at a time")
    title(draw, "Reseat a slipped chain", 221, 67, INK, ease_out(elapsed / 0.38))
    rounded(draw, (1476, 230, 1798, 294), 18, PALE_GREEN, None)
    txt(draw, (1637, 262), "BIKE · EASY · 5 MIN", 16, GREEN, 500, mono=True, anchor="mm")

    steps = [
        ("Make slack", "Pull the derailleur\narm forward."),
        ("Seat the chain", "Front ring and\nrear cog."),
        ("Backpedal", "Turn the pedal\nbackwards by hand."),
        ("Stop if it slips", "If bent or repeated,\nask a repairer."),
    ]
    left, top, width, gap, height = 84, 356, 410, 30, 365
    active = min(3, int(elapsed / 5.5))
    cycle_p = (elapsed % 5.5) / 5.5
    for index, (heading, copy) in enumerate(steps):
        reveal = ease_out((elapsed - index * 0.55) / 0.36)
        if elapsed < index * 0.55:
            continue
        x = left + index * (width + gap)
        active_scale = 1.0 if index == active else 0.965
        card_y = top + int((1 - reveal) * 90)
        card_fill = PALE_CORAL if index == 3 else WHITE
        stroke = CORAL if index == 3 else (GREEN if index == active else LINE)
        stroke_width = 5 if index == active or index == 3 else 2
        rounded(draw, (x, card_y, x + width, card_y + height), 24, card_fill, stroke, stroke_width)
        draw.ellipse((x + 26, card_y + 24, x + 86, card_y + 84), fill=CORAL if index == 3 else LIME)
        txt(draw, (x + 56, card_y + 54), f"0{index + 1}", 19, WHITE if index == 3 else GREEN, 500, mono=True, anchor="mm")
        step_icon(draw, x + 330, card_y + 60, index, active_scale)
        txt(draw, (x + 28, card_y + 136), heading, 28 if index != 2 else 29, INK, 800)
        txt(draw, (x + 28, card_y + 196), copy, 22, MUTED, 500, spacing=11)
        if index == active:
            draw.rounded_rectangle((x + 28, card_y + 316, x + width - 28, card_y + 326), radius=5, fill=LINE)
            draw.rounded_rectangle((x + 28, card_y + 316, x + 28 + int((width - 56) * cycle_p), card_y + 326), radius=5, fill=LIME)

    # The step path advances as the speaker walks through the repair.
    y_path = 772
    draw.line((142, y_path, 1770, y_path), fill=LINE, width=5)
    progress_end = 142 + int((1770 - 142) * ((active + cycle_p) / 4))
    draw.line((142, y_path, progress_end, y_path), fill=GREEN, width=6)
    for index in range(4):
        cx = 142 + int((1770 - 142) * index / 3)
        radius = 20 if index == active else 15
        draw.ellipse((cx - radius, y_path - radius, cx + radius, y_path + radius), fill=LIME if index <= active else PAPER, outline=GREEN, width=4)
        txt(draw, (cx, y_path), f"{index + 1}", 16, GREEN, 500, mono=True, anchor="mm")

    rounded(draw, (87, 832, 1834, 933), 19, GREEN, None)
    step_icon(draw, 150, 882, 3, 0.44)
    txt(draw, (205, 849), "SAFETY STOP", 15, LIME, 500, mono=True)
    txt(draw, (205, 878), "If the chain is bent or keeps slipping, stop and ask a bike repairer.", 24, WHITE, 700)
    txt(draw, (1530, 884), "TOOLS · PARTS · WHEN TO STOP", 14, "#d5e5d8", 500, mono=True, anchor="mm")
    return canvas


def scene_library(t: float, elapsed: float) -> Image.Image:
    canvas = base_frame(t)
    draw = ImageDraw.Draw(canvas)
    label(draw, 90, 176, "03 · A growing library of everyday fixes")
    title(draw, "Guides for things you use.", 227, 70, INK, ease_out(elapsed / 0.4))
    txt(draw, (98, 315), "Illustrated steps · safety notes · helpful parts to check", 24, MUTED, 500)

    cards = [
        ("BIKE", "Patch a flat tyre", "15 MIN · EASY", "flat"),
        ("HOME", "Tighten a window hinge", "15 MIN · EASY", "window"),
        ("CLOTHES", "Repair a torn seam", "20 MIN · EASY", "seam"),
    ]
    lefts = [99, 700, 1301]
    for index, (category, heading, meta, image) in enumerate(cards):
        raw = (elapsed - index * 0.32) / 0.5
        if raw < 0:
            continue
        p = ease_out(raw)
        x = int(lefts[index] + (1 - p) * (150 if index != 1 else -150))
        y = 405 + int((1 - p) * 65)
        width, height = 522, 493
        rounded(draw, (x, y, x + width, y + height), 26, WHITE, LINE, 3)
        paste_cover(canvas, image, (x + 12, y + 12, x + width - 12, y + 287), radius=19)
        draw = ImageDraw.Draw(canvas)
        txt(draw, (x + 27, y + 311), category, 16, GREEN, 500, mono=True)
        size = 29 if index == 1 else 34
        txt(draw, (x + 27, y + 349), heading, size, INK, 800)
        txt(draw, (x + 28, y + 404), meta, 15, MUTED, 500, mono=True)
        draw_arrow(draw, (x + 29, y + 458), (x + 112, y + 458), GREEN, 5)
        if index == 1:
            draw_star(draw, x + width - 54, y + 422, 19, LIME)

    # A saved guide card joins the library, making reuse visible without claiming a user metric.
    save_p = ease_out((elapsed - 5.2) / 0.45)
    if save_p > 0:
        x = int(950 + (1 - save_p) * 120)
        rounded(draw, (x, 917, x + 418, 974), 14, GREEN, None)
        txt(draw, (x + 28, 935), "Save a useful fix to the library", 17, WHITE, 700)
        draw.ellipse((x + 377, 934, x + 401, 958), fill=LIME)
        txt(draw, (x + 389, 946), "✓", 17, GREEN, 800, anchor="mm")
    return canvas


def draw_phone(canvas: Image.Image, x: int, y: int, elapsed: float, slide: float = 1.0) -> None:
    draw = ImageDraw.Draw(canvas)
    width, height = 472, 678
    p = ease_out(slide)
    x += int((1 - p) * 240)
    rounded(draw, (x - 12, y - 12, x + width + 12, y + height + 12), 61, INK, INK, 2)
    rounded(draw, (x, y, x + width, y + height), 50, PAPER, None)
    txt(draw, (x + 32, y + 22), "9:41", 16, INK, 700)
    draw.rounded_rectangle((x + width - 88, y + 27, x + width - 30, y + 40), radius=6, fill=GREEN)
    draw.line((x + 30, y + 69, x + width - 30, y + 69), fill=LINE, width=2)
    mark = IMAGES["mark"].resize((38, 38), Image.Resampling.LANCZOS)
    canvas.paste(mark, (x + 25, y + 83), mark)
    draw = ImageDraw.Draw(canvas)
    txt(draw, (x + 75, y + 91), "Vitni", 24, INK, 800)
    txt(draw, (x + 27, y + 154), "YOUR REPAIR GUIDE", 15, GREEN, 500, mono=True)
    txt(draw, (x + 27, y + 190), "Patch a flat tyre", 30, INK, 800)
    txt(draw, (x + 27, y + 234), "Step 2 of 4", 16, MUTED, 500)
    rounded(draw, (x + 27, y + 271, x + width - 27, y + 281), 5, LINE, None)
    active_width = int((width - 54) * (0.34 + 0.08 * math.sin(elapsed * 1.8)))
    rounded(draw, (x + 27, y + 271, x + 27 + active_width, y + 281), 5, LIME, None)
    rounded(draw, (x + 25, y + 313, x + width - 25, y + 524), 22, WHITE, LINE, 2)
    draw.ellipse((x + 45, y + 333, x + 96, y + 384), fill=PALE_GREEN)
    txt(draw, (x + 70, y + 358), "02", 15, GREEN, 500, mono=True, anchor="mm")
    txt(draw, (x + 111, y + 339), "Lift one tyre edge", 19, INK, 700)
    txt(draw, (x + 47, y + 407), "Use tyre levers to remove\nthe tube carefully.", 17, MUTED, 500, spacing=8)
    rounded(draw, (x + 25, y + 552, x + width - 25, y + 611), 15, GREEN, None)
    txt(draw, (x + width // 2, y + 580), "Continue the guide", 16, WHITE, 700, anchor="mm")
    rounded(draw, (x + width // 2 - 54, y + 645, x + width // 2 + 54, y + 651), 3, INK, None)


def scene_pwa(t: float, elapsed: float) -> Image.Image:
    canvas = base_frame(t)
    draw = ImageDraw.Draw(canvas)
    label(draw, 90, 175, "04 · Bring the guide with you")
    title(draw, "A web app that travels with you.", 223, 65, INK, ease_out(elapsed / 0.35))
    txt(draw, (96, 307), "Responsive on the web. Installable on your phone.", 24, MUTED, 500)

    # Home-screen tiles and an install sheet explain the PWA action; the phone shows standalone mode.
    rounded(draw, (96, 405, 771, 858), 30, CREAM, LINE, 3)
    txt(draw, (130, 438), "YOUR HOME SCREEN", 17, GREEN, 500, mono=True)
    names = [("Mail", "#e9efec"), ("Photos", PALE_CORAL), ("Vitni", LIME), ("Maps", PALE_GREEN)]
    for index, (name, color) in enumerate(names):
        x = 146 + index * 145
        rounded(draw, (x, 508, x + 86, 594), 22, color, None)
        if name == "Vitni":
            mark = IMAGES["mark"].resize((86, 86), Image.Resampling.LANCZOS)
            canvas.paste(mark, (x, 508), mark)
        else:
            draw_star(draw, x + 43, 551, 25, WHITE if name != "Maps" else LIME, GREEN)
        draw = ImageDraw.Draw(canvas)
        txt(draw, (x + 43, 616), name, 15, INK, 500, anchor="mm")
    rounded(draw, (130, 674, 739, 764), 16, WHITE, LINE, 2)
    txt(draw, (159, 694), "Vitni · repair guides", 19, INK, 700)
    txt(draw, (159, 726), "Add to Home Screen", 16, MUTED, 500)
    rounded(draw, (630, 693, 710, 743), 11, GREEN, None)
    txt(draw, (670, 718), "ADD", 14, WHITE, 700, mono=True, anchor="mm")
    txt(draw, (130, 805), "One tap from a photo to your repair steps.", 18, GREEN, 600)

    # Animated connector transforms the home-screen icon into the open Vitni guide.
    path_p = ease_in_out(elapsed / 4.8)
    connector_end = int(1010 + 172 * path_p)
    draw.line((786, 590, connector_end, 590), fill=CORAL, width=8)
    draw.polygon([(connector_end, 590), (connector_end - 25, 573), (connector_end - 25, 607)], fill=CORAL)
    pulse_x = int(786 + (connector_end - 786) * path_p)
    draw.ellipse((pulse_x - 16, 574, pulse_x + 16, 606), fill=LIME, outline=GREEN, width=3)
    draw_phone(canvas, 1240, 369, elapsed, slide=(elapsed - 0.3) / 0.5)
    return canvas


def scene_community(t: float, elapsed: float) -> Image.Image:
    canvas = base_frame(t)
    draw = ImageDraw.Draw(canvas)
    label(draw, 90, 175, "05 · Find a local hand when you need one")
    title(draw, "Repair is better together.", 224, 70, INK, ease_out(elapsed / 0.36))
    txt(draw, (96, 316), "Discover repair cafés and local workshops around Paris.", 24, MUTED, 500)

    box = (94, 397, 1192, 918)
    rounded(draw, box, 29, CREAM, LINE, 3)
    x1, y1, x2, y2 = box
    for i in range(10):
        x = x1 + 70 + i * 106
        draw.line((x, y1 + 25, x - 70, y2 - 25), fill="#f8f7f1", width=17)
    for i in range(6):
        y = y1 + 68 + i * 76
        draw.line((x1 + 25, y, x2 - 24, y + (i % 2) * 17), fill="#faf9f3", width=17)
    draw.line((x1 + 87, y1 + 470, x1 + 455, y1 + 88), fill="#d0ddc5", width=8)
    draw.line((x1 + 505, y1 + 457, x1 + 980, y1 + 72), fill="#d0ddc5", width=8)
    txt(draw, (x1 + 35, y1 + 26), "PARIS · REPAIR CAFÉS", 16, GREEN, 500, mono=True)

    pins = [(x1 + 300, y1 + 212), (x1 + 630, y1 + 338), (x1 + 858, y1 + 184)]
    for index, (px, py) in enumerate(pins):
        if elapsed < 0.8 + index * 0.9:
            continue
        pulse = int(18 + 3 * math.sin(elapsed * 1.8 + index))
        draw.ellipse((px - pulse * 2, py - pulse * 2, px + pulse * 2, py + pulse * 2), fill=LIME)
        draw.ellipse((px - pulse, py - pulse, px + pulse, py + pulse), fill=CORAL, outline=GREEN, width=4)
    draw_arrow(draw, (x1 + 300, y1 + 212), (x1 + 627, y1 + 337), GREEN, 5)
    card_x, card_y = x1 + 421, y1 + 255
    rounded(draw, (card_x, card_y, card_x + 538, card_y + 119), 17, WHITE, LINE, 2)
    txt(draw, (card_x + 24, card_y + 21), "Repair Café · Paris 10e", 21, INK, 800)
    txt(draw, (card_x + 24, card_y + 57), "Le Pari’s des Faubourgs", 16, GREEN, 500)
    txt(draw, (card_x + 24, card_y + 83), "Check with the organizer before visiting.", 14, MUTED, 500)

    rounded(draw, (1240, 397, 1825, 918), 28, GREEN, None)
    mark = IMAGES["mark"].resize((76, 76), Image.Resampling.LANCZOS)
    canvas.paste(mark, (1281, 435), mark)
    draw = ImageDraw.Draw(canvas)
    txt(draw, (1376, 450), "COMMUNITY HELP", 15, LIME, 500, mono=True)
    txt(draw, (1281, 552), "Need another\npair of hands?", 48, WHITE, 800, spacing=12)
    txt(draw, (1283, 689), "Find a café, atelier, or\nlocal workshop nearby.", 24, "#e2eee7", 500, spacing=12)
    rounded(draw, (1281, 805, 1779, 867), 15, LIME, None)
    txt(draw, (1530, 836), "Open the Paris map  →", 20, GREEN_DARK, 800, anchor="mm")
    return canvas


def draw_partner_icon(draw: ImageDraw.ImageDraw, cx: int, cy: int, kind: int) -> None:
    draw.ellipse((cx - 46, cy - 46, cx + 46, cy + 46), fill=[PALE_GREEN, PALE_CORAL, "#dcebe5", PALE_GREEN][kind])
    if kind == 0:
        draw.arc((cx - 27, cy - 20, cx + 27, cy + 35), 180, 360, fill=GREEN, width=6)
        draw.line((cx - 29, cy + 9, cx + 29, cy + 9), fill=GREEN, width=6)
        draw.line((cx - 19, cy + 24, cx + 19, cy + 24), fill=GREEN, width=5)
    elif kind == 1:
        draw.rectangle((cx - 24, cy - 24, cx + 24, cy + 24), outline=GREEN, width=5)
        draw.line((cx - 16, cy - 13, cx + 16, cy - 13), fill=CORAL, width=5)
        draw.line((cx, cy - 7, cx, cy + 24), fill=GREEN, width=5)
    elif kind == 2:
        draw.ellipse((cx - 23, cy - 23, cx + 23, cy + 23), outline=GREEN, width=5)
        draw.ellipse((cx - 7, cy - 7, cx + 7, cy + 7), outline=CORAL, width=5)
        draw.line((cx + 19, cy + 18, cx + 35, cy + 34), fill=GREEN, width=6)
    else:
        draw.polygon([(cx - 23, cy - 24), (cx + 23, cy - 24), (cx + 32, cy + 21), (cx, cy + 33), (cx - 32, cy + 21)], fill=LIME, outline=GREEN)
        txt(draw, (cx, cy + 3), "+", 28, GREEN, 800, anchor="mm")


def scene_partners(t: float, elapsed: float) -> Image.Image:
    canvas = base_frame(t)
    draw = ImageDraw.Draw(canvas)
    label(draw, 90, 176, "06 · The next step: build the local network")
    title(draw, "Local hands. The right parts.", 226, 69, INK, ease_out(elapsed / 0.38))
    txt(draw, (96, 316), "We’re looking for our first partners in Paris.", 25, MUTED, 500)

    hub = (957, 628)
    partners = [
        ("Repair cafés", 365, 500, 0),
        ("Ateliers", 1540, 500, 1),
        ("Bike repairers", 365, 780, 2),
        ("Parts shops", 1540, 780, 3),
    ]
    for index, (_, cx, cy, _) in enumerate(partners):
        if elapsed < 1.0 + index * 0.75:
            continue
        p = ease_in_out((elapsed - 1.0 - index * 0.75) / 1.5)
        end = (int(lerp(hub[0], cx, p)), int(lerp(hub[1], cy, p)))
        draw.line((hub[0], hub[1], end[0], end[1]), fill=LIME, width=8)
        draw.ellipse((end[0] - 10, end[1] - 10, end[0] + 10, end[1] + 10), fill=CORAL, outline=GREEN, width=3)

    # Hub is the repair guide connecting people, local skill and the right part.
    rounded(draw, (725, 476, 1190, 781), 28, GREEN, None)
    mark = IMAGES["mark"].resize((75, 75), Image.Resampling.LANCZOS)
    canvas.paste(mark, (920, 504), mark)
    draw = ImageDraw.Draw(canvas)
    txt(draw, (957, 599), "Vitni", 37, WHITE, 800, anchor="mm")
    txt(draw, (957, 651), "PHOTO → SAFE STEPS", 15, LIME, 500, mono=True, anchor="mm")
    txt(draw, (957, 696), "→ LOCAL HELP", 15, LIME, 500, mono=True, anchor="mm")

    for index, (heading, cx, cy, kind) in enumerate(partners):
        if elapsed < 1.0 + index * 0.75:
            continue
        p = ease_out((elapsed - 1.0 - index * 0.75) / 0.35)
        x = cx - 188
        y = cy - 84 + int((1 - p) * 35)
        rounded(draw, (x, y, x + 376, y + 166), 23, WHITE, LINE, 2)
        draw_partner_icon(draw, cx, y + 82, kind)
        txt(draw, (cx, y + 149), heading, 21, INK, 800, anchor="mm")

    rounded(draw, (596, 852, 1319, 930), 19, PALE_CORAL, CORAL, 2)
    txt(draw, (957, 891), "NEXT · Meet cafés, ateliers, repairers & parts shops", 18, GREEN, 600, mono=True, anchor="mm")
    return canvas


def scene_cities(t: float, elapsed: float) -> Image.Image:
    canvas = base_frame(t)
    draw = ImageDraw.Draw(canvas)
    label(draw, 90, 176, "07 · Start in Paris. Grow city by city.")
    title(draw, "Repair that travels.", 228, 77, INK, ease_out(elapsed / 0.45))
    txt(draw, (97, 336), "Listen locally. Build trust. Open the next city together.", 25, MUTED, 500)

    # Abstract city map and network nodes avoid implying specific launch locations.
    map_box = (94, 438, 1076, 923)
    rounded(draw, map_box, 29, CREAM, LINE, 3)
    x1, y1, x2, y2 = map_box
    for i in range(8):
        x = x1 + 80 + i * 122
        draw.line((x, y1 + 22, x - 130, y2 - 20), fill="#faf9f3", width=15)
    for i in range(6):
        y = y1 + 55 + i * 78
        draw.line((x1 + 22, y, x2 - 22, y + (i % 2) * 22), fill="#faf9f3", width=15)
    paris = (x1 + 308, y1 + 230)
    future = [(x1 + 673, y1 + 115), (x1 + 748, y1 + 344), (x1 + 495, y1 + 411)]
    for index, point in enumerate(future):
        reveal = ease_in_out((elapsed - 2.0 - index * 1.15) / 2.2)
        if reveal <= 0:
            continue
        end = (int(lerp(paris[0], point[0], reveal)), int(lerp(paris[1], point[1], reveal)))
        draw.line((paris, end), fill="#9dbb74", width=6)
        draw.ellipse((end[0] - 17, end[1] - 17, end[0] + 17, end[1] + 17), fill=LIME, outline=GREEN, width=4)
    draw.ellipse((paris[0] - 29, paris[1] - 29, paris[0] + 29, paris[1] + 29), fill=CORAL, outline=GREEN, width=5)
    rounded(draw, (paris[0] - 85, paris[1] + 39, paris[0] + 87, paris[1] + 87), 12, WHITE, LINE, 2)
    txt(draw, (paris[0], paris[1] + 63), "PARIS PILOT", 13, GREEN, 500, mono=True, anchor="mm")
    if elapsed > 6.1:
        txt(draw, (x1 + 691, y1 + 413), "NEXT CITIES", 15, GREEN, 500, mono=True, anchor="mm")

    rounded(draw, (1134, 438, 1825, 923), 30, GREEN, None)
    paste_mascot(canvas, (1360, 456 + int(5 * math.sin(elapsed * 1.8))), (260, 292), math.sin(elapsed * 1.2) * 1.0)
    draw = ImageDraw.Draw(canvas)
    draw_star(draw, 1288, 538, 20, LIME)
    draw_star(draw, 1692, 534, 18, CORAL)
    txt(draw, (1480, 780), "Repair cafés, ateliers,\nparts shops in Paris?", 25, WHITE, 700, anchor="mm", spacing=9)
    rounded(draw, (1209, 836, 1750, 886), 13, LIME, None)
    txt(draw, (1479, 861), "Let’s build this together", 18, GREEN_DARK, 800, anchor="mm")
    txt(draw, (1480, 905), "vitni.cc", 16, "#d5e5d8", 500, mono=True, anchor="mm")
    return canvas


SCENES = [
    (0.0, 15.0, scene_hook),
    (15.0, 28.0, scene_photo),
    (28.0, 50.0, scene_steps),
    (50.0, 62.0, scene_library),
    (62.0, 73.0, scene_pwa),
    (73.0, 84.0, scene_community),
    (84.0, 100.0, scene_partners),
    (100.0, 110.0, scene_cities),
]


def render_frame(t: float) -> Image.Image:
    index = len(SCENES) - 1
    for i, (start, end, _) in enumerate(SCENES):
        if start <= t < end:
            index = i
            break
    start, _, scene = SCENES[index]
    elapsed = t - start
    canvas = scene(t, elapsed)
    section_wipe(canvas, elapsed, index)
    return canvas.convert("RGB")


def make_audio(path: Path) -> None:
    sample_rate = 48000
    sample_count = sample_rate * DURATION
    chord_events = [
        (0.0, 523.25), (15.0, 587.33), (28.0, 659.25), (50.0, 783.99),
        (62.0, 698.46), (73.0, 523.25), (84.0, 659.25), (100.0, 783.99), (106.0, 1046.5),
    ]
    pad_notes = (130.81, 164.81, 196.0)
    mono = array("h", [0]) * sample_count
    tau = 2 * math.pi

    # A quiet, slow harmonic bed sits far below the live talk track.
    for i in range(sample_count):
        t = i / sample_rate
        swell = 0.68 + 0.32 * (0.5 + 0.5 * math.sin(tau * t / 24.0))
        fade_in = min(1.0, t / 1.2)
        fade_out = min(1.0, (DURATION - t) / 2.0)
        mono[i] = int(sum(math.sin(tau * note * t) for note in pad_notes) * 54 * swell * fade_in * fade_out)

    # Tiny mallet-like cues at chapter changes help the motion feel connected.
    for start, frequency in chord_events:
        offset = int(start * sample_rate)
        length = int(0.62 * sample_rate)
        for j in range(length):
            dt = j / sample_rate
            envelope = math.exp(-dt * 6.0)
            tone = (math.sin(tau * frequency * dt) + 0.22 * math.sin(tau * frequency * 2.01 * dt)) * 760 * envelope
            index = offset + j
            mono[index] = max(-32768, min(32767, int(mono[index] + tone)))

    stereo = array("h")
    for sample in mono:
        stereo.append(sample)
        stereo.append(sample)
    with wave.open(str(path), "wb") as wav:
        wav.setnchannels(2)
        wav.setsampwidth(2)
        wav.setframerate(sample_rate)
        wav.writeframes(stereo.tobytes())


def make_contact_sheet() -> None:
    times = [7.5, 21.5, 39.0, 55.5, 67.5, 78.0, 91.0, 105.0]
    tile_w, tile_h, label_h = 480, 270, 38
    sheet = Image.new("RGB", (tile_w * 4, (tile_h + label_h) * 2), PAPER)
    draw = ImageDraw.Draw(sheet)
    for index, timecode in enumerate(times):
        frame_id = min(FRAME_COUNT - 1, int(timecode * FPS))
        frame_path = FRAMES / f"{frame_id:05d}.jpg"
        frame = Image.open(frame_path).convert("RGB").resize((tile_w, tile_h), Image.Resampling.LANCZOS)
        x = (index % 4) * tile_w
        y = (index // 4) * (tile_h + label_h)
        sheet.paste(frame, (x, y))
        txt(draw, (x + 13, y + tile_h + 7), f"{int(timecode // 60):02d}:{timecode % 60:04.1f}", 18, GREEN, 500, mono=True)
    sheet.save(OUT / "contact-sheet.png", optimize=True)
    Image.open(FRAMES / f"{int(105.0 * FPS):05d}.jpg").convert("RGB").save(OUT / "poster.png", optimize=True)


def main() -> None:
    FRAMES.mkdir(parents=True, exist_ok=True)
    for old_frame in FRAMES.glob("*.jpg"):
        old_frame.unlink()

    for frame_index in range(FRAME_COUNT):
        timecode = frame_index / FPS
        render_frame(timecode).save(FRAMES / f"{frame_index:05d}.jpg", quality=93, subsampling=0, optimize=False)
        if frame_index % 300 == 0:
            print(f"Rendered {frame_index:04d}/{FRAME_COUNT} frames", flush=True)

    audio_path = OUT / "vitni-pitch-soundtrack.wav"
    output_path = OUT / "vitni-pitch-110s.mp4"
    make_audio(audio_path)
    ffmpeg = shutil.which("ffmpeg")
    if not ffmpeg:
        raise SystemExit("ffmpeg is required to encode the pitch video")
    subprocess.run(
        [
            ffmpeg, "-y", "-hide_banner", "-loglevel", "warning",
            "-framerate", str(FPS), "-i", str(FRAMES / "%05d.jpg"),
            "-i", str(audio_path), "-frames:v", str(FRAME_COUNT), "-t", str(DURATION),
            "-c:v", "libx264", "-preset", "medium", "-crf", "19", "-pix_fmt", "yuv420p",
            "-c:a", "aac", "-b:a", "128k", "-movflags", "+faststart", str(output_path),
        ],
        check=True,
    )
    make_contact_sheet()
    shutil.rmtree(FRAMES)
    audio_path.unlink(missing_ok=True)
    print(f"Video written to {output_path}", flush=True)


if __name__ == "__main__":
    main()
