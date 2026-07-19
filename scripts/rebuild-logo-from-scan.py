# -*- coding: utf-8 -*-
"""
Rebuild Qingyi logos from the approved concept scan.

Keeps the real brush / feibai texture of the seal (extracted from the concept
PNG) and pairs it with crisp vector Songti wordmarks — matching the concept's
organic-seal + clean-type contrast.
"""

from __future__ import annotations

import base64
import io
import shutil
from pathlib import Path

import numpy as np
from fontTools.misc.transform import Transform
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.transformPen import TransformPen
from fontTools.ttLib import TTFont
from PIL import Image

DESKTOP = Path.home() / "Desktop" / "qingyi"
SOURCE = DESKTOP / "01_Logo_Source"
ASSETS = SOURCE / "assets"
EXPORT = DESKTOP / "07-Export-Ready"
ALT = DESKTOP / "01-Logo"

CONCEPT = Path(
    r"C:\Users\wu200\.cursor\projects\c-Users-wu200-Projects-qingyi\assets"
    r"\qingyi-logo-concept-03-seal-wordmark.png"
)

SAGE = "#689078"
INK = "#282828"
PAPER = "#F4F2EE"
BLACK = "#0A0A0A"
GHOST = "#C8D4CE"

FONT_PATHS = [
    (r"C:\Windows\Fonts\STSONG.TTF", 0),
    (r"C:\Windows\Fonts\simsun.ttc", 0),
]

# Seal crop in the 1536×1024 concept (ink columns ~282–510, rows ~390–619).
SEAL_BOX = (278, 386, 514, 622)  # L T R B with a little pad
UPSCALE = 4  # → ~944px seal masters


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


def hex_rgb(hex_color: str) -> tuple[int, int, int]:
    h = hex_color.lstrip("#")
    return int(h[0:2], 16), int(h[2:4], 16), int(h[4:6], 16)


def extract_seal_rgba() -> Image.Image:
    """Cut seal from concept and build alpha from ink density (keeps feibai)."""
    im = Image.open(CONCEPT).convert("RGB")
    crop = np.asarray(im.crop(SEAL_BOX), dtype=np.float32)
    # Concept seal is strongly bimodal: ink ~luma 120–145, paper ~252–255.
    luma = 0.2126 * crop[:, :, 0] + 0.7152 * crop[:, :, 1] + 0.0722 * crop[:, :, 2]
    # Hard-kill paper; soft ramp only inside real ink so dry-brush voids stay open.
    ink = np.clip((228.0 - luma) / (228.0 - 118.0), 0.0, 1.0)
    ink = np.where(luma > 228.0, 0.0, ink)
    # Tiny cleanup of isolated paper speckles without eating feibai holes.
    ink = np.where(ink < 0.08, 0.0, ink)

    rgba = np.zeros((crop.shape[0], crop.shape[1], 4), dtype=np.uint8)
    for c in range(3):
        rgba[:, :, c] = np.clip(crop[:, :, c], 0, 255).astype(np.uint8)
    rgba[:, :, 3] = np.clip(np.round(ink * 255.0), 0, 255).astype(np.uint8)

    out = Image.fromarray(rgba, "RGBA")
    if UPSCALE != 1:
        out = out.resize(
            (out.width * UPSCALE, out.height * UPSCALE),
            Image.Resampling.LANCZOS,
        )
        # Re-threshold soft fringe from upscale so paper stays fully clear.
        arr = np.asarray(out).astype(np.float32)
        arr[:, :, 3] = np.where(arr[:, :, 3] < 18, 0, arr[:, :, 3])
        out = Image.fromarray(arr.astype(np.uint8), "RGBA")
    return out


def recolor_seal(seal: Image.Image, color: str) -> Image.Image:
    """Tint seal to a brand color while preserving scanned alpha / feibai."""
    arr = np.asarray(seal).astype(np.float32)
    alpha = arr[:, :, 3]
    # Brush pressure from original ink darkness (only where alpha lives).
    luma = (
        0.2126 * arr[:, :, 0] + 0.7152 * arr[:, :, 1] + 0.0722 * arr[:, :, 2]
    )
    pressure = np.clip((200.0 - luma) / 90.0, 0.55, 1.0)
    r, g, b = hex_rgb(color)
    out = np.zeros_like(arr)
    out[:, :, 0] = r
    out[:, :, 1] = g
    out[:, :, 2] = b
    out[:, :, 3] = np.clip(np.round(alpha * pressure), 0, 255)
    out[:, :, 3] = np.where(alpha < 1, 0, out[:, :, 3])
    return Image.fromarray(out.astype(np.uint8), "RGBA")


def png_b64(im: Image.Image) -> str:
    buf = io.BytesIO()
    im.save(buf, format="PNG", optimize=True)
    return base64.b64encode(buf.getvalue()).decode("ascii")


def seal_image_svg(b64: str, size: float, native: tuple[int, int]) -> str:
    nw, nh = native
    uri = f"data:image/png;base64,{b64}"
    return (
        f'  <g id="seal">\n'
        f'    <image href="{uri}" xlink:href="{uri}" '
        f'x="0" y="0" width="{size:.2f}" height="{size:.2f}" '
        f'preserveAspectRatio="xMidYMid meet" '
        f'data-native="{nw}x{nh}"/>\n'
        f"  </g>"
    )


def horizontal(
    seal_svg: str,
    font: TTFont,
    *,
    text_color: str,
    bg: str | None = None,
    title: str = "primary",
    seal_size: float = 200,
) -> str:
    cn_frags, cn_w, cn_h = text_paths(font, "青意传媒", target_height=64, letter_spacing=3.5)
    en_frags, en_w, en_h = text_paths(font, "QINGYI MEDIA", target_height=16, tracking_em=0.28)
    gap = 36
    text_block_h = cn_h + 14 + en_h
    text_top = (seal_size - text_block_h) / 2
    total_w = seal_size + gap + max(cn_w, en_w)
    pad = 24
    vb_w = total_w + pad * 2
    vb_h = seal_size + pad * 2
    en_scale_x = min(cn_w / en_w, 1.18) if en_w and en_w < cn_w * 0.98 else 1.0
    bg_rect = f'<rect width="100%" height="100%" fill="{bg}"/>' if bg else ""
    return f'''<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink"
     viewBox="0 0 {vb_w:.1f} {vb_h:.1f}" role="img" aria-label="青意传媒 Qingyi Media">
  <title>青意传媒 · {title}</title>
  <desc>Scanned brush-seal lockup: concept feibai seal + Songti wordmark.</desc>
  {bg_rect}
  <g transform="translate({pad},{pad})">
{seal_svg}
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


def stacked(
    seal_svg: str,
    font: TTFont,
    text_color: str,
    bg: str | None = None,
    seal_size: float = 200,
) -> str:
    cn_frags, cn_w, cn_h = text_paths(font, "青意传媒", target_height=52, letter_spacing=3.0)
    en_frags, en_w, en_h = text_paths(font, "QINGYI MEDIA", target_height=14, tracking_em=0.26)
    gap = 28
    content_w = max(seal_size, cn_w, en_w)
    total_h = seal_size + gap + cn_h + 12 + en_h
    pad = 24
    bg_rect = f'<rect width="100%" height="100%" fill="{bg}"/>' if bg else ""
    en_scale_x = min(cn_w / en_w, 1.18) if en_w else 1.0
    return f'''<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink"
     viewBox="0 0 {content_w + pad * 2:.1f} {total_h + pad * 2:.1f}"
     role="img" aria-label="青意传媒 Qingyi Media">
  <title>青意传媒 · stacked</title>
  {bg_rect}
  <g transform="translate({pad},{pad})">
    <g transform="translate({(content_w - seal_size) / 2:.1f},0)">
{seal_svg}
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


def seal_only(b64: str, native: tuple[int, int], bg: str | None = None, size: float = 512) -> str:
    pad = size * 0.06
    inner = size - pad * 2
    bg_rect = f'<rect width="100%" height="100%" fill="{bg}"/>' if bg else ""
    return f'''<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink"
     viewBox="0 0 {size} {size}" width="{size}" height="{size}"
     role="img" aria-label="青意传媒 青字印">
  <title>青意传媒 · Seal (scanned brush)</title>
  {bg_rect}
  <g transform="translate({pad},{pad})">
{seal_image_svg(b64, inner, native)}
  </g>
</svg>
'''


def write(path: Path, content: str) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(content, encoding="utf-8")
    print("wrote", path.relative_to(DESKTOP))


def main() -> None:
    if not CONCEPT.exists():
        raise FileNotFoundError(CONCEPT)

    ASSETS.mkdir(parents=True, exist_ok=True)
    SOURCE.mkdir(parents=True, exist_ok=True)

    raw = extract_seal_rgba()
    sage = recolor_seal(raw, SAGE)
    ink = recolor_seal(raw, INK)
    white = recolor_seal(raw, "#F2F5F3")
    ghost = recolor_seal(raw, GHOST)

    # Master PNGs (also useful for print / social).
    for name, im in [
        ("QingyiMedia_Seal_Brush_Source.png", raw),
        ("QingyiMedia_Seal_Brush_Sage.png", sage),
        ("QingyiMedia_Seal_Brush_Ink.png", ink),
        ("QingyiMedia_Seal_Brush_White.png", white),
    ]:
        dest = ASSETS / name
        im.save(dest, format="PNG", optimize=True)
        print("wrote", dest.relative_to(DESKTOP), f"{im.size[0]}x{im.size[1]}")

    # Copy concept into source for provenance.
    shutil.copy2(CONCEPT, ASSETS / "concept-03-seal-wordmark-source.png")

    native = sage.size
    b64_sage = png_b64(sage)
    b64_ink = png_b64(ink)
    b64_white = png_b64(white)
    b64_ghost = png_b64(ghost)

    seal_sage = seal_image_svg(b64_sage, 200, native)
    seal_ink = seal_image_svg(b64_ink, 200, native)
    seal_white = seal_image_svg(b64_white, 200, native)
    seal_ghost = seal_image_svg(b64_ghost, 200, native)

    font = load_font()

    write(
        SOURCE / "QingyiMedia_Logo_Primary_Horizontal.svg",
        horizontal(seal_sage, font, text_color=INK, title="primary-brush"),
    )
    write(
        SOURCE / "QingyiMedia_Logo_Primary_OnPaper.svg",
        horizontal(seal_sage, font, text_color=INK, bg=PAPER, title="primary-on-paper"),
    )
    write(
        SOURCE / "QingyiMedia_Logo_Primary_Reversed.svg",
        horizontal(seal_white, font, text_color="#F2F5F3", bg=BLACK, title="reversed"),
    )
    write(
        SOURCE / "QingyiMedia_Logo_Monochrome_Black.svg",
        horizontal(seal_ink, font, text_color=INK, title="mono-ink"),
    )
    write(
        SOURCE / "QingyiMedia_Logo_Ghost_OnBlack.svg",
        horizontal(seal_ghost, font, text_color=GHOST, bg=BLACK, title="ghost-on-black"),
    )
    write(SOURCE / "QingyiMedia_Logo_Stacked.svg", stacked(seal_sage, font, INK))
    write(SOURCE / "QingyiMedia_Mark_Jade.svg", seal_only(b64_sage, native))
    write(SOURCE / "QingyiMedia_Mark_Black.svg", seal_only(b64_ink, native))
    write(SOURCE / "QingyiMedia_Mark_White.svg", seal_only(b64_white, native, bg=BLACK))
    write(SOURCE / "QingyiMedia_Favicon.svg", seal_only(b64_sage, native, size=64))

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
    write(
        SOURCE / "QingyiMedia_Logo_Clearspace.svg",
        horizontal(seal_sage, font, text_color=INK, title="clearspace-ref"),
    )

    mapping = {
        ALT / "01-Primary" / "qingyi-logo-primary.svg": SOURCE
        / "QingyiMedia_Logo_Primary_Horizontal.svg",
        ALT / "01-Primary" / "qingyi-logo-primary-on-paper.svg": SOURCE
        / "QingyiMedia_Logo_Primary_OnPaper.svg",
        ALT / "02-Seal" / "qingyi-seal.svg": SOURCE / "QingyiMedia_Mark_Jade.svg",
        ALT / "02-Seal" / "qingyi-seal-on-ink.svg": SOURCE / "QingyiMedia_Mark_White.svg",
        ALT / "03-Stacked" / "qingyi-logo-stacked.svg": SOURCE / "QingyiMedia_Logo_Stacked.svg",
        ALT / "04-Mono" / "qingyi-logo-mono-ink.svg": SOURCE
        / "QingyiMedia_Logo_Monochrome_Black.svg",
        ALT / "04-Mono" / "qingyi-seal-mono-ink.svg": SOURCE / "QingyiMedia_Mark_Black.svg",
        ALT / "05-Reverse" / "qingyi-logo-reverse.svg": SOURCE
        / "QingyiMedia_Logo_Primary_Reversed.svg",
        EXPORT / "logo-header.svg": SOURCE / "QingyiMedia_Logo_Primary_Horizontal.svg",
        EXPORT / "logo-icon.svg": SOURCE / "QingyiMedia_Mark_Jade.svg",
        EXPORT / "logo-dark-bg.svg": SOURCE / "QingyiMedia_Logo_Primary_Reversed.svg",
        EXPORT / "logo-stacked.svg": SOURCE / "QingyiMedia_Logo_Stacked.svg",
        EXPORT / "logo-ghost-on-black.svg": SOURCE / "QingyiMedia_Logo_Ghost_OnBlack.svg",
    }
    for dest, src in mapping.items():
        dest.parent.mkdir(parents=True, exist_ok=True)
        shutil.copy2(src, dest)
        print("copied", dest.relative_to(DESKTOP))

    # Transparent reverse (no bg rect) for templates
    write(
        ALT / "05-Reverse" / "qingyi-logo-reverse-transparent.svg",
        horizontal(seal_white, font, text_color="#F2F5F3", title="reverse-transparent"),
    )

    # Paper composites for quick visual check / export.
    paper = Image.new("RGBA", sage.size, (244, 242, 238, 255))
    Image.alpha_composite(paper, sage).save(
        EXPORT / "preview-seal-brush-on-paper.png", format="PNG", optimize=True
    )
    shutil.copy2(ASSETS / "QingyiMedia_Seal_Brush_Sage.png", EXPORT / "seal-brush-sage.png")

    note = DESKTOP / "06_Documentation" / "LOGO_SCAN_NOTES.txt"
    note.parent.mkdir(parents=True, exist_ok=True)
    note.write_text(
        "v2.0 Scanned brush seal from concept-03\n"
        "-------------------------------------\n"
        "Seal mark is extracted from the approved concept PNG so the\n"
        "dry-brush / feibai texture is preserved (not a synthetic SVG stroke).\n"
        "Wordmark remains vector Songti for crisp print scaling.\n"
        "Masters: 01_Logo_Source/assets/QingyiMedia_Seal_Brush_*.png\n"
        "Rebuild: python scripts/rebuild-logo-from-scan.py\n"
        "Then:    python scripts/rebuild-templates-handdrawn.py\n",
        encoding="utf-8",
    )
    print("DONE scanned brush-seal rebuild")


if __name__ == "__main__":
    main()
