# -*- coding: utf-8 -*-
"""Rebuild Qingyi logos: hand-drawn irregular outline seal + sage 青 + charcoal wordmark."""

from __future__ import annotations

import math
import random
import shutil
from pathlib import Path

from fontTools.misc.transform import Transform
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.transformPen import TransformPen
from fontTools.ttLib import TTFont

DESKTOP = Path.home() / "Desktop" / "qingyi"
SOURCE = DESKTOP / "01_Logo_Source"
EXPORT = DESKTOP / "07-Export-Ready"
ALT = DESKTOP / "01-Logo"

# Matched from the approved concept image samples.
SAGE = "#689078"  # seal + 青
INK = "#282828"  # Chinese + English wordmark
PAPER = "#F4F2EE"
BLACK = "#0A0A0A"
GHOST = "#1A3330"  # dark mono on black (subtle teal-ink)

FONT_PATHS = [
    (r"C:\Windows\Fonts\STSONG.TTF", 0),
    (r"C:\Windows\Fonts\simsun.ttc", 0),
]


def load_font() -> TTFont:
    for path, index in FONT_PATHS:
        p = Path(path)
        if p.exists():
            return TTFont(str(p), fontNumber=index) if p.suffix.lower() == ".ttc" else TTFont(str(p))
    raise FileNotFoundError("CJK font not found")


def text_paths(
    font: TTFont,
    text: str,
    *,
    target_height: float,
    letter_spacing: float = 0.0,
    tracking_em: float = 0.0,
) -> tuple[list[str], float, float]:
    cmap = font.getBestCmap()
    glyph_set = font.getGlyphSet()
    units = font["head"].unitsPerEm
    scale = target_height / units
    hmtx = font["hmtx"]

    ascents: list[int] = []
    for ch in text:
        if ch == " ":
            continue
        name = cmap[ord(ch)]
        if "glyf" in font and name in font["glyf"]:
            g = font["glyf"][name]
            ascents.append(getattr(g, "yMax", units) or units)
        else:
            ascents.append(units)
    y_max = max(ascents) if ascents else units

    fragments: list[str] = []
    cursor = 0.0
    for ch in text:
        if ch == " ":
            cursor += units * (0.32 + tracking_em) * scale + letter_spacing
            continue
        name = cmap[ord(ch)]
        pen = SVGPathPen(glyph_set)
        transform = Transform(scale, 0, 0, -scale, cursor, y_max * scale)
        tpen = TransformPen(pen, transform)
        glyph_set[name].draw(tpen)
        d = pen.getCommands()
        if d:
            fragments.append(d)
        cursor += hmtx[name][0] * scale + letter_spacing + units * tracking_em * scale
    return fragments, cursor, y_max * scale


def paths_xml(fragments: list[str], fill: str) -> str:
    return "\n".join(f'    <path fill="{fill}" d="{d}"/>' for d in fragments)


def _rounded_square_points(
    cx: float,
    cy: float,
    half: float,
    corner: float,
    n_side: int,
    n_corner: int,
    rng: random.Random,
    wobble: float,
) -> list[tuple[float, float]]:
    """Sample a rounded square perimeter with hand-drawn wobble."""
    pts: list[tuple[float, float]] = []
    # Four sides + four corners, clockwise from top-left after corner.
    # Top edge (left -> right)
    x0, x1 = cx - half + corner, cx + half - corner
    y_top = cy - half
    for i in range(n_side + 1):
        t = i / n_side
        x = x0 + (x1 - x0) * t
        y = y_top + rng.uniform(-wobble, wobble)
        # Slight bowing of the edge (ink pressure feel).
        y += math.sin(t * math.pi) * wobble * 0.35 * (1 if rng.random() > 0.4 else -1)
        pts.append((x, y))
    # Top-right corner
    for i in range(1, n_corner + 1):
        a = -math.pi / 2 + (math.pi / 2) * (i / n_corner)
        r = corner + rng.uniform(-wobble * 0.9, wobble * 1.1)
        pts.append((cx + half - corner + r * math.cos(a), cy - half + corner + r * math.sin(a)))
    # Right edge
    y0, y1 = cy - half + corner, cy + half - corner
    x_right = cx + half
    for i in range(1, n_side + 1):
        t = i / n_side
        y = y0 + (y1 - y0) * t
        x = x_right + rng.uniform(-wobble, wobble)
        x += math.sin(t * math.pi) * wobble * 0.4
        pts.append((x, y))
    # Bottom-right corner
    for i in range(1, n_corner + 1):
        a = 0 + (math.pi / 2) * (i / n_corner)
        r = corner + rng.uniform(-wobble * 0.9, wobble * 1.2)
        pts.append((cx + half - corner + r * math.cos(a), cy + half - corner + r * math.sin(a)))
    # Bottom edge (right -> left)
    for i in range(1, n_side + 1):
        t = i / n_side
        x = x1 - (x1 - x0) * t
        y = cy + half + rng.uniform(-wobble, wobble)
        y -= math.sin(t * math.pi) * wobble * 0.3
        pts.append((x, y))
    # Bottom-left corner
    for i in range(1, n_corner + 1):
        a = math.pi / 2 + (math.pi / 2) * (i / n_corner)
        r = corner + rng.uniform(-wobble * 1.0, wobble * 1.15)
        pts.append((cx - half + corner + r * math.cos(a), cy + half - corner + r * math.sin(a)))
    # Left edge (bottom -> top)
    for i in range(1, n_side + 1):
        t = i / n_side
        y = y1 - (y1 - y0) * t
        x = cx - half + rng.uniform(-wobble, wobble)
        x -= math.sin(t * math.pi) * wobble * 0.35
        pts.append((x, y))
    # Top-left corner
    for i in range(1, n_corner):
        a = math.pi + (math.pi / 2) * (i / n_corner)
        r = corner + rng.uniform(-wobble * 0.85, wobble * 1.05)
        pts.append((cx - half + corner + r * math.cos(a), cy - half + corner + r * math.sin(a)))
    return pts


def _smooth_open_path(pts: list[tuple[float, float]]) -> str:
    """Open Catmull-Rom-ish cubic path (no Z) for a seal with a deliberate gap."""
    n = len(pts)
    if n < 4:
        raise ValueError("need more points")
    # Pad ends by reflecting neighbors so tangents stay calm at the gap tips.
    ext = [pts[0], pts[0]] + pts + [pts[-1], pts[-1]]
    d = [f"M {pts[0][0]:.3f} {pts[0][1]:.3f}"]
    for i in range(2, n + 1):
        p0, p1, p2, p3 = ext[i - 1], ext[i], ext[i + 1], ext[i + 2]
        c1x = p1[0] + (p2[0] - p0[0]) / 6
        c1y = p1[1] + (p2[1] - p0[1]) / 6
        c2x = p2[0] - (p3[0] - p1[0]) / 6
        c2y = p2[1] - (p3[1] - p1[1]) / 6
        d.append(f"C {c1x:.3f} {c1y:.3f} {c2x:.3f} {c2y:.3f} {p2[0]:.3f} {p2[1]:.3f}")
    return " ".join(d)


def _seal_centerline_with_bottom_gap(
    size: float,
    seed: int,
) -> list[tuple[float, float]]:
    """
    Build an almost-closed irregular square centerline, leaving a small ink-break
    gap on the bottom edge near the bottom-left — matching the approved concept.
    生成接近闭合的手绘方印中线，在底边偏左留出概念图同款小缺口。
    """
    rng = random.Random(seed)
    cx = cy = size / 2
    half = size * 0.465
    corner = size * 0.105
    wobble = size * 0.011
    n_side, n_corner = 8, 5

    # Full loop points (closed sampling), then open them by cutting the bottom-left gap.
    closed = _rounded_square_points(cx, cy, half, corner, n_side, n_corner, rng, wobble)

    # Point layout from _rounded_square_points:
    # top(n_side+1) + TR(n_corner) + right(n_side) + BR(n_corner)
    # + bottom(n_side) + BL(n_corner) + left(n_side) + TL(n_corner-1)
    top_n = n_side + 1
    tr_n = n_corner
    right_n = n_side
    br_n = n_corner
    bottom_n = n_side
    bl_n = n_corner
    left_n = n_side
    # tl_n = n_corner - 1

    i_bottom0 = top_n + tr_n + right_n + br_n
    # Bottom runs right→left. Open just before the BL corner, then pull the
    # two tips together so only a tiny tip-to-tip gap remains (after round
    # caps this reads as a subtle ink-break, not a large missing segment).
    # 底边偏左切开，再把两端收拢到很小间距；圆笔帽后只剩细小断墨。
    cut = i_bottom0 + bottom_n - 1  # last bottom sample (near BL)
    if cut < 2 or cut >= len(closed) - 2:
        cut = max(2, len(closed) // 2)

    rotated = closed[cut:] + closed[:cut]
    # Tip distance before round caps; visual clear ≈ this − stroke (~0.055·size).
    # Keep a hairline ink-break: caps nearly kiss, still reads as intentional.
    target_gap = size * 0.058
    p0, p1 = rotated[0], rotated[-1]
    dx, dy = p1[0] - p0[0], p1[1] - p0[1]
    dist = math.hypot(dx, dy) or 1.0
    if dist > target_gap:
        pull = (dist - target_gap) / 2
        ux, uy = dx / dist, dy / dist
        start = (p0[0] + ux * pull, p0[1] + uy * pull)
        end = (p1[0] - ux * pull, p1[1] - uy * pull)
    else:
        start, end = p0, p1
    return [start] + rotated[1:-1] + [end]


def handdrawn_seal_frame(size: float, color: str, seed: int = 20260718) -> str:
    """Hand-ink seal frame with a small bottom gap (open stroked path + soft under-ink)."""
    pts = _seal_centerline_with_bottom_gap(size, seed)
    d = _smooth_open_path(pts)
    stroke = size * 0.055
    # Dual stroke: slightly thicker soft underlayer + crisp main stroke (brush feel).
    under = stroke * 1.22
    return f'''    <path d="{d}" fill="none" stroke="{color}" stroke-opacity="0.28"
          stroke-width="{under:.3f}" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="{d}" fill="none" stroke="{color}"
          stroke-width="{stroke:.3f}" stroke-linecap="round" stroke-linejoin="round"/>'''


def outline_seal(font: TTFont, size: float, color: str) -> str:
    """Hand-drawn irregular outline seal + 青 (slight organic offset)."""
    char_h = size * 0.54
    frags, w, h = text_paths(font, "青", target_height=char_h)
    # Tiny asymmetric placement so the character feels stamped, not CAD-perfect.
    pad_x = (size - w) / 2 + size * 0.008
    pad_y = (size - h) / 2 - size * 0.006
    # Very slight rotation for hand-stamp feel.
    rot = -1.2
    return f'''  <g id="seal">
{handdrawn_seal_frame(size, color)}
    <g transform="translate({pad_x:.2f},{pad_y:.2f}) rotate({rot} {w/2:.2f} {h/2:.2f})">
{paths_xml(frags, color)}
    </g>
  </g>'''


def horizontal(
    font: TTFont,
    *,
    seal_color: str,
    text_color: str,
    bg: str | None = None,
    title: str = "primary",
    # Concept uses wide-tracked Latin; space letters optically under Chinese width.
    english: str = "QINGYI MEDIA",
) -> str:
    seal_size = 200
    cn_frags, cn_w, cn_h = text_paths(font, "青意传媒", target_height=64, letter_spacing=3.5)
    # Extra tracking so English approaches Chinese width.
    en_frags, en_w, en_h = text_paths(
        font, english, target_height=16, tracking_em=0.28
    )
    # If English still shorter, distribute remaining gap via translate scale on x for en group.
    gap = 36
    text_block_h = cn_h + 14 + en_h
    text_top = (seal_size - text_block_h) / 2
    total_w = seal_size + gap + max(cn_w, en_w)
    pad = 24
    vb_w = total_w + pad * 2
    vb_h = seal_size + pad * 2

    en_scale_x = (cn_w / en_w) if en_w > 0 and en_w < cn_w * 0.98 else 1.0
    # Cap stretch so letters don't look distorted.
    en_scale_x = min(en_scale_x, 1.18)

    bg_rect = f'<rect width="100%" height="100%" fill="{bg}"/>' if bg else ""
    return f'''<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {vb_w:.1f} {vb_h:.1f}"
     role="img" aria-label="青意传媒 Qingyi Media">
  <title>青意传媒 · {title}</title>
  <desc>Hand-drawn irregular seal lockup: organic sage frame + 青, charcoal wordmark, tracked English.</desc>
  {bg_rect}
  <g transform="translate({pad},{pad})">
{outline_seal(font, seal_size, seal_color)}
    <g transform="translate({seal_size + gap},{text_top:.1f})">
      <g id="cn">
{paths_xml(cn_frags, text_color)}
      </g>
      <g id="en" transform="translate(0,{cn_h + 14:.1f}) scale({en_scale_x:.4f},1)">
{paths_xml(en_frags, text_color)}
      </g>
    </g>
  </g>
</svg>
'''


def stacked(font: TTFont, seal_color: str, text_color: str, bg: str | None = None) -> str:
    seal_size = 200
    cn_frags, cn_w, cn_h = text_paths(font, "青意传媒", target_height=52, letter_spacing=3.0)
    en_frags, en_w, en_h = text_paths(font, "QINGYI MEDIA", target_height=14, tracking_em=0.26)
    gap = 28
    content_w = max(seal_size, cn_w, en_w)
    total_h = seal_size + gap + cn_h + 12 + en_h
    pad = 24
    bg_rect = f'<rect width="100%" height="100%" fill="{bg}"/>' if bg else ""
    en_scale_x = min(cn_w / en_w, 1.18) if en_w else 1.0
    return f'''<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {content_w + pad * 2:.1f} {total_h + pad * 2:.1f}"
     role="img" aria-label="青意传媒 Qingyi Media">
  <title>青意传媒 · stacked</title>
  {bg_rect}
  <g transform="translate({pad},{pad})">
    <g transform="translate({(content_w - seal_size) / 2:.1f},0)">
{outline_seal(font, seal_size, seal_color)}
    </g>
    <g transform="translate({(content_w - cn_w) / 2:.1f},{seal_size + gap:.1f})">
{paths_xml(cn_frags, text_color)}
    </g>
    <g transform="translate({(content_w - en_w * en_scale_x) / 2:.1f},{seal_size + gap + cn_h + 12:.1f}) scale({en_scale_x:.4f},1)">
{paths_xml(en_frags, text_color)}
    </g>
  </g>
</svg>
'''


def seal_only(font: TTFont, color: str, bg: str | None = None, size: float = 512) -> str:
    pad = size * 0.08
    inner = size - pad * 2
    bg_rect = f'<rect width="100%" height="100%" fill="{bg}"/>' if bg else ""
    return f'''<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {size} {size}" width="{size}" height="{size}"
     role="img" aria-label="青意传媒 青字印">
  <title>青意传媒 · Seal</title>
  {bg_rect}
  <g transform="translate({pad},{pad})">
{outline_seal(font, inner, color)}
  </g>
</svg>
'''


def write(path: Path, content: str) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(content, encoding="utf-8")
    print("wrote", path.relative_to(DESKTOP))


def main() -> None:
    font = load_font()
    SOURCE.mkdir(parents=True, exist_ok=True)

    # --- Formal source set (overwrite) ---
    write(
        SOURCE / "QingyiMedia_Logo_Primary_Horizontal.svg",
        horizontal(font, seal_color=SAGE, text_color=INK, title="primary-outline"),
    )
    write(
        SOURCE / "QingyiMedia_Logo_Primary_OnPaper.svg",
        horizontal(
            font, seal_color=SAGE, text_color=INK, bg=PAPER, title="primary-on-paper"
        ),
    )
    write(
        SOURCE / "QingyiMedia_Logo_Primary_Reversed.svg",
        horizontal(
            font,
            seal_color="#F2F5F3",
            text_color="#F2F5F3",
            bg=BLACK,
            title="reversed",
        ),
    )
    write(
        SOURCE / "QingyiMedia_Logo_Monochrome_Black.svg",
        horizontal(font, seal_color=INK, text_color=INK, title="mono-ink"),
    )
    write(
        SOURCE / "QingyiMedia_Logo_Ghost_OnBlack.svg",
        horizontal(
            font,
            seal_color=GHOST,
            text_color=GHOST,
            bg=BLACK,
            title="ghost-on-black",
        ),
    )
    write(
        SOURCE / "QingyiMedia_Logo_Stacked.svg",
        stacked(font, SAGE, INK),
    )
    write(SOURCE / "QingyiMedia_Mark_Jade.svg", seal_only(font, SAGE))
    write(SOURCE / "QingyiMedia_Mark_Black.svg", seal_only(font, INK))
    write(
        SOURCE / "QingyiMedia_Mark_White.svg",
        seal_only(font, "#F2F5F3", bg=BLACK),
    )
    write(SOURCE / "QingyiMedia_Favicon.svg", seal_only(font, SAGE, size=64))

    # Wordmark-only (no seal)
    cn_frags, cn_w, cn_h = text_paths(font, "青意传媒", target_height=64, letter_spacing=3.5)
    en_frags, en_w, en_h = text_paths(font, "QINGYI MEDIA", target_height=16, tracking_em=0.28)
    en_scale = min(cn_w / en_w, 1.18) if en_w else 1.0
    pad = 24
    write(
        SOURCE / "QingyiMedia_Wordmark.svg",
        f'''<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {cn_w + pad * 2:.1f} {cn_h + 14 + en_h + pad * 2:.1f}">
  <g transform="translate({pad},{pad})">
{paths_xml(cn_frags, INK)}
    <g transform="translate(0,{cn_h + 14:.1f}) scale({en_scale:.4f},1)">
{paths_xml(en_frags, INK)}
    </g>
  </g>
</svg>
''',
    )

    # Clearspace diagram (simple)
    primary = horizontal(font, seal_color=SAGE, text_color=INK, title="clearspace-ref")
    write(SOURCE / "QingyiMedia_Logo_Clearspace.svg", primary)

    # Mirror into numbered folders + export-ready
    mapping = {
        ALT / "01-Primary" / "qingyi-logo-primary.svg": SOURCE
        / "QingyiMedia_Logo_Primary_Horizontal.svg",
        ALT / "01-Primary" / "qingyi-logo-primary-on-paper.svg": SOURCE
        / "QingyiMedia_Logo_Primary_OnPaper.svg",
        ALT / "02-Seal" / "qingyi-seal.svg": SOURCE / "QingyiMedia_Mark_Jade.svg",
        ALT / "02-Seal" / "qingyi-seal-on-ink.svg": SOURCE / "QingyiMedia_Mark_White.svg",
        ALT / "03-Stacked" / "qingyi-logo-stacked.svg": SOURCE
        / "QingyiMedia_Logo_Stacked.svg",
        ALT / "04-Mono" / "qingyi-logo-mono-ink.svg": SOURCE
        / "QingyiMedia_Logo_Monochrome_Black.svg",
        ALT / "04-Mono" / "qingyi-seal-mono-ink.svg": SOURCE / "QingyiMedia_Mark_Black.svg",
        ALT / "05-Reverse" / "qingyi-logo-reverse.svg": SOURCE
        / "QingyiMedia_Logo_Primary_Reversed.svg",
        ALT / "05-Reverse" / "qingyi-logo-reverse-transparent.svg": horizontal(
            # write content directly below
            font,
            seal_color="#F2F5F3",
            text_color="#F2F5F3",
            title="reverse-transparent",
        ),
        EXPORT / "logo-header.svg": SOURCE / "QingyiMedia_Logo_Primary_Horizontal.svg",
        EXPORT / "logo-icon.svg": SOURCE / "QingyiMedia_Mark_Jade.svg",
        EXPORT / "logo-dark-bg.svg": SOURCE / "QingyiMedia_Logo_Primary_Reversed.svg",
        EXPORT / "logo-stacked.svg": SOURCE / "QingyiMedia_Logo_Stacked.svg",
        EXPORT / "logo-ghost-on-black.svg": SOURCE / "QingyiMedia_Logo_Ghost_OnBlack.svg",
    }

    for dest, src in mapping.items():
        dest.parent.mkdir(parents=True, exist_ok=True)
        if isinstance(src, str):
            write(dest, src)
        else:
            shutil.copy2(src, dest)
            print("copied", dest.relative_to(DESKTOP))

    # Also refresh brand-book referenced primary preview note
    note = DESKTOP / "01_Logo_Source" / "STYLE_NOTE.txt"
    note.write_text(
        "v1.4 Hand-drawn Irregular Seal WITH hairline bottom gap\n"
        f"Seal/青 color: {SAGE}\n"
        f"Wordmark color: {INK}\n"
        "Style: open organic stroke (not closed ring); deliberate ink-break gap\n"
        "on the bottom edge near bottom-left — matches approved concept image.\n"
        "Character 青 slightly rotated for stamped feel.\n"
        "Applied to ALL lockups / marks / templates.\n",
        encoding="utf-8",
    )
    print("DONE hand-drawn seal + bottom gap rebuild")


if __name__ == "__main__":
    main()
