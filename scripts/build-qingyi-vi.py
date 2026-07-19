# -*- coding: utf-8 -*-
"""Build Qingyi Media VI package onto the Windows Desktop."""

from __future__ import annotations

import json
from pathlib import Path

from fontTools.misc.transform import Transform
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.transformPen import TransformPen
from fontTools.ttLib import TTFont

DESKTOP = Path.home() / "Desktop" / "qingyi"

# Brand colors — aligned with the live site system, refined for print.
JADE = "#0C8A6B"
JADE_DEEP = "#086B52"
JADE_SOFT = "#2BB894"
INK = "#0F1F1B"
INK_SOFT = "#3D524C"
PAPER = "#F3F7F5"
WHITE = "#FFFFFF"
MIST = "#5F746D"

# Prefer Songti for the cultural / premium wordmark; YaHei as fallback.
FONT_CANDIDATES = [
    (r"C:\Windows\Fonts\STSONG.TTF", 0),
    (r"C:\Windows\Fonts\simsun.ttc", 0),
    (r"C:\Windows\Fonts\msyh.ttc", 0),
]


def load_font() -> TTFont:
    for path, index in FONT_CANDIDATES:
        p = Path(path)
        if not p.exists():
            continue
        if p.suffix.lower() == ".ttc":
            return TTFont(str(p), fontNumber=index)
        return TTFont(str(p))
    raise FileNotFoundError("No suitable CJK font found on this machine.")


def glyph_path(font: TTFont, char: str) -> tuple[str, int, int]:
    cmap = font.getBestCmap()
    glyph_set = font.getGlyphSet()
    name = cmap.get(ord(char))
    if not name:
        raise KeyError(f"Glyph missing for {char!r}")
    pen = SVGPathPen(glyph_set)
    glyph_set[name].draw(pen)
    units = font["head"].unitsPerEm
    # Vertical metrics for centering.
    glyf = font["glyf"] if "glyf" in font else None
    if glyf and name in glyf:
        g = glyf[name]
        return pen.getCommands(), units, g.yMax if hasattr(g, "yMax") else units
    return pen.getCommands(), units, units


def text_paths(
    font: TTFont,
    text: str,
    *,
    target_height: float,
    letter_spacing: float = 0.0,
    tracking_em: float = 0.0,
) -> tuple[list[tuple[str, float, float]], float, float]:
    """Return list of (d, x, y) path fragments in a shared coordinate system.

    Origin is top-left of the text block; Y grows downward (SVG).
    """
    cmap = font.getBestCmap()
    glyph_set = font.getGlyphSet()
    units = font["head"].unitsPerEm
    scale = target_height / units
    hmtx = font["hmtx"]

    # Find max ascent among glyphs for baseline alignment.
    ascents: list[int] = []
    for ch in text:
        if ch == " ":
            continue
        name = cmap.get(ord(ch))
        if not name:
            raise KeyError(f"Glyph missing for {ch!r}")
        if "glyf" in font and name in font["glyf"]:
            g = font["glyf"][name]
            ascents.append(getattr(g, "yMax", units) or units)
        else:
            ascents.append(units)
    y_max = max(ascents) if ascents else units

    fragments: list[tuple[str, float, float]] = []
    cursor = 0.0
    for ch in text:
        if ch == " ":
            # Em-space style gap for tracked English.
            advance = units * (0.35 + tracking_em)
            cursor += advance * scale + letter_spacing
            continue
        name = cmap[ord(ch)]
        pen = SVGPathPen(glyph_set)
        # Flip Y (font Y-up -> SVG Y-down) and place baseline.
        transform = Transform(scale, 0, 0, -scale, cursor, y_max * scale)
        tpen = TransformPen(pen, transform)
        glyph_set[name].draw(tpen)
        fragments.append((pen.getCommands(), 0.0, 0.0))
        advance = hmtx[name][0]
        cursor += advance * scale + letter_spacing + units * tracking_em * scale
    height = y_max * scale
    return fragments, cursor, height


def paths_to_group(fragments: list[tuple[str, float, float]], fill: str) -> str:
    parts = []
    for d, _x, _y in fragments:
        if d:
            parts.append(f'<path fill="{fill}" d="{d}"/>')
    return "\n    ".join(parts)


def ensure_dirs() -> dict[str, Path]:
    tree = {
        "root": DESKTOP,
        "logo": DESKTOP / "01-Logo",
        "logo_primary": DESKTOP / "01-Logo" / "01-Primary",
        "logo_seal": DESKTOP / "01-Logo" / "02-Seal",
        "logo_stacked": DESKTOP / "01-Logo" / "03-Stacked",
        "logo_mono": DESKTOP / "01-Logo" / "04-Mono",
        "logo_reverse": DESKTOP / "01-Logo" / "05-Reverse",
        "color": DESKTOP / "02-Color",
        "type": DESKTOP / "03-Typography",
        "usage": DESKTOP / "04-Clearspace-Usage",
        "apps": DESKTOP / "05-Applications",
        "book": DESKTOP / "06-Brand-Book",
        "export": DESKTOP / "07-Export-Ready",
    }
    for path in tree.values():
        path.mkdir(parents=True, exist_ok=True)
    return tree


def write(path: Path, content: str) -> None:
    path.write_text(content, encoding="utf-8")
    print("wrote", path)


def build_seal_mark(font: TTFont, fill: str, size: float = 120) -> str:
    """Square seal with 青, slight corner radius, internal padding."""
    # Character fills ~62% of seal.
    char_h = size * 0.58
    frags, w, h = text_paths(font, "青", target_height=char_h)
    # Center inside seal.
    pad_x = (size - w) / 2
    pad_y = (size - h) / 2
    r = size * 0.06
    stroke = size * 0.055
    paths = []
    for d, _, _ in frags:
        # Offset paths into seal.
        # Re-draw with extra translation — rebuild with offset via transform in d is hard;
        # wrap in <g transform>.
        paths.append(d)
    group = "\n      ".join(f'<path fill="{fill}" d="{d}"/>' for d in paths if d)
    return f'''  <g id="seal">
    <rect x="{stroke/2}" y="{stroke/2}" width="{size-stroke}" height="{size-stroke}"
          rx="{r}" ry="{r}" fill="none" stroke="{fill}" stroke-width="{stroke}"/>
    <g transform="translate({pad_x},{pad_y})">
      {group}
    </g>
  </g>'''


def build_horizontal_logo(
    font: TTFont,
    *,
    seal_fill: str,
    text_fill: str,
    bg: str | None = None,
    filename_hint: str = "primary",
) -> str:
    seal_size = 120
    # Chinese wordmark height ~42, English ~14, gap between lines ~10
    cn_frags, cn_w, cn_h = text_paths(font, "青意传媒", target_height=42, letter_spacing=2.2)
    en_frags, en_w, en_h = text_paths(
        font,
        "QINGYI MEDIA",
        target_height=11,
        tracking_em=0.22,
    )
    # Stretch English tracking to roughly match Chinese width by adding extra space if needed.
    # Already tracked; if still shorter, we leave as-is for optical balance.
    gap_seal_text = 22
    text_block_h = cn_h + 10 + en_h
    text_top = (seal_size - text_block_h) / 2
    total_w = seal_size + gap_seal_text + max(cn_w, en_w)
    total_h = seal_size
    pad = 16
    vb_w = total_w + pad * 2
    vb_h = total_h + pad * 2

    cn_group = paths_to_group(cn_frags, text_fill)
    en_group = paths_to_group(en_frags, text_fill)
    seal = build_seal_mark(font, seal_fill, seal_size)

    bg_rect = (
        f'<rect width="100%" height="100%" fill="{bg}"/>' if bg else ""
    )

    return f'''<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {vb_w:.1f} {vb_h:.1f}"
     role="img" aria-label="青意传媒 Qingyi Media">
  <title>青意传媒 · Qingyi Media — {filename_hint}</title>
  <desc>Horizontal lockup: jade seal with 青 + Chinese wordmark 青意传媒 + English QINGYI MEDIA. Original brand mark for Qingyi Media.</desc>
  {bg_rect}
  <g transform="translate({pad},{pad})">
{seal}
    <g transform="translate({seal_size + gap_seal_text},{text_top:.1f})">
      <g id="wordmark-cn">
    {cn_group}
      </g>
      <g id="wordmark-en" transform="translate(0,{cn_h + 10:.1f})">
    {en_group}
      </g>
    </g>
  </g>
</svg>
'''


def build_stacked_logo(font: TTFont, seal_fill: str, text_fill: str, bg: str | None = None) -> str:
    seal_size = 120
    cn_frags, cn_w, cn_h = text_paths(font, "青意传媒", target_height=36, letter_spacing=2.0)
    en_frags, en_w, en_h = text_paths(
        font, "QINGYI MEDIA", target_height=10, tracking_em=0.2
    )
    gap = 18
    content_w = max(seal_size, cn_w, en_w)
    total_h = seal_size + gap + cn_h + 8 + en_h
    pad = 16
    vb_w = content_w + pad * 2
    vb_h = total_h + pad * 2
    seal = build_seal_mark(font, seal_fill, seal_size)
    bg_rect = f'<rect width="100%" height="100%" fill="{bg}"/>' if bg else ""
    return f'''<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {vb_w:.1f} {vb_h:.1f}"
     role="img" aria-label="青意传媒 Qingyi Media">
  <title>青意传媒 · Qingyi Media — stacked</title>
  {bg_rect}
  <g transform="translate({pad},{pad})">
    <g transform="translate({(content_w - seal_size) / 2:.1f},0)">
{seal}
    </g>
    <g transform="translate({(content_w - cn_w) / 2:.1f},{seal_size + gap:.1f})">
    {paths_to_group(cn_frags, text_fill)}
    </g>
    <g transform="translate({(content_w - en_w) / 2:.1f},{seal_size + gap + cn_h + 8:.1f})">
    {paths_to_group(en_frags, text_fill)}
    </g>
  </g>
</svg>
'''


def build_seal_only(font: TTFont, fill: str, bg: str | None = None) -> str:
    size = 200
    pad = 12
    seal = build_seal_mark(font, fill, size)
    bg_rect = f'<rect width="100%" height="100%" fill="{bg}"/>' if bg else ""
    return f'''<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {size + pad * 2} {size + pad * 2}"
     role="img" aria-label="青意传媒 青字印">
  <title>青意传媒 · Seal Mark</title>
  {bg_rect}
  <g transform="translate({pad},{pad})">
{seal}
  </g>
</svg>
'''


def build_color_palette_svg() -> str:
    swatches = [
        ("Qingyi Jade", JADE, "Primary", "HEX 0C8A6B · RGB 12,138,107 · CMYK 91,0,62,0"),
        ("Jade Deep", JADE_DEEP, "Primary Dark", "HEX 086B52 · RGB 8,107,82"),
        ("Jade Soft", JADE_SOFT, "Accent", "HEX 2BB894 · RGB 43,184,148"),
        ("Ink", INK, "Type / Logo Text", "HEX 0F1F1B · RGB 15,31,27"),
        ("Ink Soft", INK_SOFT, "Secondary Type", "HEX 3D524C · RGB 61,82,76"),
        ("Mist", MIST, "Caption / Meta", "HEX 5F746D · RGB 95,116,109"),
        ("Paper", PAPER, "Background", "HEX F3F7F5 · RGB 243,247,245"),
        ("White", WHITE, "Background / Reverse", "HEX FFFFFF · RGB 255,255,255"),
    ]
    row_h = 72
    width = 720
    height = 40 + len(swatches) * row_h
    rows = []
    for i, (name, hex_c, role, codes) in enumerate(swatches):
        y = 40 + i * row_h
        text_c = WHITE if hex_c.lower() in {JADE.lower(), JADE_DEEP.lower(), INK.lower(), INK_SOFT.lower(), MIST.lower()} else INK
        rows.append(
            f'''  <g transform="translate(40,{y})">
    <rect width="120" height="56" rx="0" fill="{hex_c}" stroke="#DCE7E2" stroke-width="1"/>
    <text x="140" y="22" font-family="Microsoft YaHei, sans-serif" font-size="16" fill="{INK}">{name}</text>
    <text x="140" y="42" font-family="Consolas, monospace" font-size="12" fill="{MIST}">{role} · {codes}</text>
  </g>'''
        )
    return f'''<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {width} {height}" width="{width}" height="{height}">
  <rect width="100%" height="100%" fill="{PAPER}"/>
  <text x="40" y="28" font-family="Songti SC, STSong, SimSun, serif" font-size="20" fill="{INK}">青意传媒 · Color System</text>
{chr(10).join(rows)}
</svg>
'''


def build_clearspace_svg(font: TTFont) -> str:
    # Show primary logo with X clearspace where X = 1/4 seal size.
    logo = build_horizontal_logo(font, seal_fill=JADE, text_fill=INK)
    # Simpler dedicated diagram:
    seal_size = 80
    x = seal_size / 4
    seal = build_seal_mark(font, JADE, seal_size)
    cn_frags, cn_w, cn_h = text_paths(font, "青意传媒", target_height=28, letter_spacing=1.5)
    en_frags, en_w, en_h = text_paths(font, "QINGYI MEDIA", target_height=8, tracking_em=0.18)
    gap = 14
    logo_w = seal_size + gap + max(cn_w, en_w)
    logo_h = seal_size
    pad = x * 3
    vb_w = logo_w + x * 2 + pad * 2
    vb_h = logo_h + x * 2 + pad * 2 + 40
    ox = pad + x
    oy = pad + x + 30
    return f'''<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {vb_w:.1f} {vb_h:.1f}">
  <rect width="100%" height="100%" fill="{WHITE}"/>
  <text x="{pad}" y="28" font-family="Microsoft YaHei, sans-serif" font-size="14" fill="{INK}">Clear Space · 净空区 = X（方印边长的 1/4）</text>
  <!-- clearspace box -->
  <rect x="{ox - x:.1f}" y="{oy - x:.1f}" width="{logo_w + 2*x:.1f}" height="{logo_h + 2*x:.1f}"
        fill="none" stroke="{JADE_SOFT}" stroke-width="1" stroke-dasharray="4 3"/>
  <g transform="translate({ox},{oy})">
{seal}
    <g transform="translate({seal_size + gap},{(seal_size - (cn_h + 8 + en_h)) / 2:.1f})">
    {paths_to_group(cn_frags, INK)}
      <g transform="translate(0,{cn_h + 8:.1f})">
    {paths_to_group(en_frags, INK)}
      </g>
    </g>
    <!-- X markers -->
    <rect x="{-x:.1f}" y="0" width="{x:.1f}" height="{x:.1f}" fill="{JADE}" opacity="0.25"/>
    <text x="{-x/2:.1f}" y="{x*0.65:.1f}" text-anchor="middle" font-family="Georgia, serif" font-size="10" fill="{JADE_DEEP}">X</text>
  </g>
</svg>
'''


def build_donts_svg(font: TTFont) -> str:
    # Six incorrect usage tiles.
    cases = [
        ("拉伸变形", "stretch"),
        ("随意改色", "recolor"),
        ("添加阴影", "shadow"),
        ("旋转倾斜", "rotate"),
        ("低对比背景", "contrast"),
        ("拥挤遮挡", "crowd"),
    ]
    tile = 200
    cols = 3
    rows = 2
    gap = 24
    pad = 40
    w = pad * 2 + cols * tile + (cols - 1) * gap
    h = pad * 2 + 40 + rows * (tile + 36) + (rows - 1) * gap
    tiles = []
    for i, (label, kind) in enumerate(cases):
        col = i % cols
        row = i // cols
        x = pad + col * (tile + gap)
        y = pad + 40 + row * (tile + 36 + gap)
        # Mini logo inside
        seal = build_seal_mark(font, JADE if kind != "recolor" else "#E85D4C", 48)
        cn_frags, _, cn_h = text_paths(font, "青意", target_height=16, letter_spacing=1)
        fill = "#E85D4C" if kind == "recolor" else INK
        inner = f'''
    <rect width="{tile}" height="{tile}" fill="{PAPER if kind != "contrast" else "#9AA89F"}" stroke="#DCE7E2"/>
    <g transform="translate(30,60)">
      <g transform="{"scale(1.6,0.7) " if kind == "stretch" else ""}{"rotate(-18) " if kind == "rotate" else ""}">
{seal}
      </g>
      <g transform="translate(60,12)" {"opacity='0.35'" if kind == "contrast" else ""}>
        {paths_to_group(cn_frags, fill)}
      </g>
      {"<rect x='20' y='10' width='120' height='40' fill='rgba(12,138,107,0.55)'/>" if kind == "crowd" else ""}
      {"<g opacity='0.4'><ellipse cx='50' cy='70' rx='40' ry='8' fill='#000'/></g>" if kind == "shadow" else ""}
    </g>
    <text x="{tile/2}" y="{tile + 22}" text-anchor="middle" font-family="Microsoft YaHei, sans-serif" font-size="13" fill="#B4534B">✕ {label}</text>
'''
        tiles.append(f'  <g transform="translate({x},{y})">{inner}</g>')

    return f'''<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {w} {h}">
  <rect width="100%" height="100%" fill="{WHITE}"/>
  <text x="{pad}" y="{pad}" font-family="Songti SC, STSong, SimSun, serif" font-size="20" fill="{INK}">Incorrect Usage · 错误示范</text>
{chr(10).join(tiles)}
</svg>
'''


def build_colors_json() -> str:
    data = {
        "brand": "青意传媒 Qingyi Media",
        "primary": {
            "jade": {"hex": JADE, "rgb": [12, 138, 107], "cmyk": [91, 0, 62, 0], "pantone_approx": "PMS 334 C"},
            "jadeDeep": {"hex": JADE_DEEP, "rgb": [8, 107, 82]},
            "jadeSoft": {"hex": JADE_SOFT, "rgb": [43, 184, 148]},
        },
        "neutral": {
            "ink": {"hex": INK, "rgb": [15, 31, 27]},
            "inkSoft": {"hex": INK_SOFT, "rgb": [61, 82, 76]},
            "mist": {"hex": MIST, "rgb": [95, 116, 109]},
            "paper": {"hex": PAPER, "rgb": [243, 247, 245]},
            "white": {"hex": WHITE, "rgb": [255, 255, 255]},
        },
    }
    return json.dumps(data, ensure_ascii=False, indent=2)


def build_brand_book_html(dirs: dict[str, Path]) -> str:
    # Relative paths from 06-Brand-Book/
    return f'''<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1"/>
<title>青意传媒 · Visual Identity Guidelines</title>
<style>
  :root {{
    --jade: {JADE};
    --jade-deep: {JADE_DEEP};
    --ink: {INK};
    --mist: {MIST};
    --paper: {PAPER};
    --white: {WHITE};
  }}
  * {{ box-sizing: border-box; }}
  body {{
    margin: 0;
    font-family: "PingFang SC", "Microsoft YaHei", sans-serif;
    color: var(--ink);
    background: var(--paper);
    line-height: 1.7;
  }}
  .page {{
    max-width: 920px;
    margin: 0 auto;
    padding: 64px 40px 96px;
    background: var(--white);
    box-shadow: 0 0 0 1px rgba(15,31,27,0.06);
  }}
  h1, h2, h3 {{ font-family: "Songti SC", "STSong", "SimSun", serif; font-weight: 700; }}
  h1 {{ font-size: 2.4rem; letter-spacing: 0.04em; margin: 0 0 0.4em; }}
  h2 {{
    font-size: 1.5rem;
    margin: 2.8rem 0 1rem;
    padding-bottom: 0.4rem;
    border-bottom: 2px solid var(--jade);
  }}
  h3 {{ font-size: 1.1rem; margin: 1.6rem 0 0.6rem; color: var(--jade-deep); }}
  .eyebrow {{
    font-size: 0.75rem;
    letter-spacing: 0.22em;
    text-transform: uppercase;
    color: var(--mist);
    margin-bottom: 1rem;
  }}
  .lede {{ font-size: 1.05rem; color: var(--mist); max-width: 38em; }}
  .meta {{ margin-top: 2rem; font-size: 0.85rem; color: var(--mist); }}
  .figure {{
    margin: 1.2rem 0 1.6rem;
    padding: 28px;
    border: 1px solid rgba(15,31,27,0.08);
    background: var(--paper);
    text-align: center;
  }}
  .figure img, .figure object {{ max-width: 100%; height: auto; }}
  .grid-2 {{ display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }}
  .swatch {{
    display: flex; gap: 14px; align-items: center;
    padding: 12px; border: 1px solid rgba(15,31,27,0.08);
  }}
  .swatch .chip {{ width: 56px; height: 56px; flex-shrink: 0; }}
  .swatch code {{ font-size: 0.8rem; color: var(--mist); }}
  table {{ width: 100%; border-collapse: collapse; font-size: 0.92rem; }}
  th, td {{ border-bottom: 1px solid rgba(15,31,27,0.1); padding: 10px 8px; text-align: left; vertical-align: top; }}
  th {{ color: var(--mist); font-weight: 600; font-size: 0.8rem; }}
  .do {{ color: var(--jade-deep); }}
  .dont {{ color: #B4534B; }}
  ul {{ padding-left: 1.2rem; }}
  li {{ margin: 0.35rem 0; }}
  .toc a {{ color: var(--jade-deep); text-decoration: none; }}
  .toc a:hover {{ text-decoration: underline; }}
  @media print {{
    body {{ background: white; }}
    .page {{ box-shadow: none; padding: 24px; max-width: none; }}
    h2 {{ break-after: avoid; }}
    .figure {{ break-inside: avoid; }}
  }}
</style>
</head>
<body>
<main class="page">
  <p class="eyebrow">Visual Identity Guidelines · 2026</p>
  <h1>青意传媒</h1>
  <p class="lede">Qingyi Media Brand VI Manual — 以「方印 + 字标横排」为主标识的视觉识别规范。结构参照国际品牌手册常见体例（Logo / Color / Typography / Clear Space / Don'ts / Applications），并结合青意传媒现有站点气质（青绿、冷纸、宋体标题）。</p>
  <p class="meta">
    品牌：青意传媒（青意贸易（福建福清市）有限公司）<br/>
    定位：创意内容产业 · 主播孵化 · 平台分发与变现<br/>
    主标识方案：③ 方印「青」+ 字标「青意传媒 / QINGYI MEDIA」<br/>
    文件版本：v1.0 · 原创设计，非照搬任何第三方商标
  </p>

  <h2>0. 目录 Contents</h2>
  <ol class="toc">
    <li><a href="#brand">品牌概述</a></li>
    <li><a href="#logo">Logo 系统</a></li>
    <li><a href="#color">色彩系统</a></li>
    <li><a href="#type">字体系统</a></li>
    <li><a href="#space">净空与最小尺寸</a></li>
    <li><a href="#donts">错误示范</a></li>
    <li><a href="#apps">应用场景</a></li>
    <li><a href="#files">交付文件索引</a></li>
  </ol>

  <h2 id="brand">1. 品牌概述</h2>
  <p>青意传媒是面向直播与短视频的创意内容公会。视觉识别需要同时传达「文化根基」与「当代媒介专业度」：方印承载汉字「青」的辨识锚点，宋体字标提供高端编辑气质，英文大写字距展开形成国际化阅读层。</p>
  <h3>设计原则</h3>
  <ul>
    <li><strong>克制</strong>：少装饰、直角与微圆角并存，避免廉价渐变与描边堆叠。</li>
    <li><strong>可缩放</strong>：方印可独立作为 App / 头像 / 聊天气球图标。</li>
    <li><strong>双语文脉</strong>：中文为主、英文为辅，英文字距对齐中文视觉宽度。</li>
    <li><strong>青绿为唯一主色</strong>：不引入第二强调色（如紫、橙）以免稀释识别。</li>
  </ul>

  <h2 id="logo">2. Logo 系统</h2>
  <h3>2.1 主标识 Primary Lockup（横排）</h3>
  <p>左：方印「青」；右上：青意传媒；右下：QINGYI MEDIA。默认用于网站页头、名片、PPT 封面、合同页眉。</p>
  <div class="figure">
    <img src="../01-Logo/01-Primary/qingyi-logo-primary.svg" alt="Primary logo" width="520"/>
  </div>

  <h3>2.2 方印 Seal（独立）</h3>
  <p>空间不足或需要强符号时使用（favicon、聊天入口、社交媒体头像、水印）。</p>
  <div class="figure">
    <img src="../01-Logo/02-Seal/qingyi-seal.svg" alt="Seal" width="160"/>
  </div>

  <h3>2.3 竖式 Stacked</h3>
  <p>用于正方形版心、海报中轴、移动端启动页。</p>
  <div class="figure">
    <img src="../01-Logo/03-Stacked/qingyi-logo-stacked.svg" alt="Stacked logo" width="200"/>
  </div>

  <h3>2.4 单色 / 反白</h3>
  <div class="grid-2">
    <div class="figure">
      <img src="../01-Logo/04-Mono/qingyi-logo-mono-ink.svg" alt="Mono ink" width="280"/>
      <p>单色墨黑 · 印刷单色稿</p>
    </div>
    <div class="figure" style="background:#0F1F1B">
      <img src="../01-Logo/05-Reverse/qingyi-logo-reverse.svg" alt="Reverse" width="280"/>
      <p style="color:#F3F7F5">反白 · 深色背景</p>
    </div>
  </div>

  <h2 id="color">3. 色彩系统</h2>
  <div class="figure">
    <img src="../02-Color/qingyi-color-palette.svg" alt="Color palette"/>
  </div>
  <div class="swatch"><div class="chip" style="background:{JADE}"></div><div><strong>Qingyi Jade</strong><br/><code>{JADE} · RGB 12,138,107 · CMYK 91,0,62,0 · PMS approx. 334 C</code></div></div>
  <div class="swatch"><div class="chip" style="background:{INK}"></div><div><strong>Ink</strong><br/><code>{INK} · 主文字 / 字标</code></div></div>
  <div class="swatch"><div class="chip" style="background:{PAPER};border:1px solid #ddd"></div><div><strong>Paper</strong><br/><code>{PAPER} · 页面底色</code></div></div>
  <p>方印描边与「青」字使用 Jade；中英文案使用 Ink。勿将方印改为红色传统印章色——本品牌是「当代青绿」，不是「朱红印泥」。</p>

  <h2 id="type">4. 字体系统</h2>
  <table>
    <tr><th>层级</th><th>中文</th><th>英文 / 数字</th><th>用途</th></tr>
    <tr><td>品牌 / 标题</td><td>宋体（Songti SC / STSong / SimSun）</td><td>Georgia / Source Serif</td><td>Logo 字标、封面标题</td></tr>
    <tr><td>正文</td><td>苹方 / 微软雅黑</td><td>system-ui / Segoe UI</td><td>网站、文档、UI</td></tr>
    <tr><td>数据 / 代码</td><td>—</td><td>Consolas / Tabular nums</td><td>后台数据表、色值标注</td></tr>
  </table>
  <p>Logo 文件已将字形转曲（path），不依赖终端安装字体即可正确显示。文案排版请优先使用上述字体栈。</p>

  <h2 id="space">5. 净空与最小尺寸</h2>
  <div class="figure">
    <img src="../04-Clearspace-Usage/qingyi-clearspace.svg" alt="Clear space"/>
  </div>
  <ul>
    <li><strong>净空 X</strong>：方印边长的 1/4。Logo 四周不得侵入文字、按钮、图片边缘。</li>
    <li><strong>数字最小宽度</strong>：横排主标识 ≥ 120px；方印独立 ≥ 24px（favicon 可用 16px 简化实心方印）。</li>
    <li><strong>印刷最小宽度</strong>：横排 ≥ 28mm；方印 ≥ 8mm。</li>
  </ul>

  <h2 id="donts">6. 错误示范</h2>
  <div class="figure">
    <img src="../04-Clearspace-Usage/qingyi-donts.svg" alt="Don'ts"/>
  </div>
  <ul>
    <li class="dont">禁止：拉伸、倾斜、添加投影/发光、改成非规范色。</li>
    <li class="dont">禁止：在低对比或花哨背景上直接叠放。</li>
    <li class="dont">禁止：拆开方印与字标重新排成未批准的结构（除非使用本手册已列的 Stacked / Seal）。</li>
    <li class="do">允许：在 Paper / White / Ink 深底上的标准色与反白版本。</li>
  </ul>

  <h2 id="apps">7. 应用场景建议</h2>
  <table>
    <tr><th>场景</th><th>推荐版本</th><th>备注</th></tr>
    <tr><td>网站 Header</td><td>Primary 横排</td><td>高度建议 28–36px（按方印高度计）</td></tr>
    <tr><td>Favicon / 聊天球</td><td>Seal</td><td>与站点「青」圆形入口可共用识别</td></tr>
    <tr><td>名片</td><td>Primary</td><td>印在纸白或 Paper 底</td></tr>
    <tr><td>PPT 封面</td><td>Primary 或 Stacked</td><td>深色封面用 Reverse</td></tr>
    <tr><td>合同 / 页眉</td><td>Mono Ink 或 Primary</td><td>单色印刷用 Mono</td></tr>
    <tr><td>社交媒体头像</td><td>Seal</td><td>留足净空，勿裁切边框</td></tr>
  </table>

  <h2 id="files">8. 交付文件索引</h2>
  <pre style="background:{PAPER};padding:16px;overflow:auto;font-size:0.85rem;">qingyi/
├── 01-Logo/
│   ├── 01-Primary/     横排主标识（彩色 / 等）
│   ├── 02-Seal/        方印独立
│   ├── 03-Stacked/     竖式组合
│   ├── 04-Mono/        单色墨黑
│   └── 05-Reverse/     反白（深底）
├── 02-Color/           色板 SVG + colors.json
├── 03-Typography/      字体说明
├── 04-Clearspace-Usage/ 净空图 + 错误示范
├── 05-Applications/    应用示意
├── 06-Brand-Book/      本规范书（HTML，可打印为 PDF）
└── 07-Export-Ready/    常用导出副本
  </pre>
  <p class="meta">打印本规范：用 Chrome / Edge 打开本 HTML → 打印 → 另存为 PDF。<br/>
  本 VI 为青意传媒原创视觉方案；结构学习了公开品牌手册体例，未复制任何第三方商标图形。</p>
</main>
</body>
</html>
'''


def build_readme() -> str:
    return f"""# 青意传媒 · Visual Identity Kit（v1.0）

本文件夹为「青意传媒 / Qingyi Media」视觉识别交付包。

## 主标识方案
**③ 方印 + 字标横排**：左为方印「青」，右为「青意传媒」+ 英文「QINGYI MEDIA」。

## 文件夹说明
| 目录 | 内容 |
|------|------|
| `01-Logo` | 全套 SVG Logo（主标识 / 方印 / 竖式 / 单色 / 反白） |
| `02-Color` | 色彩系统图 + `colors.json` |
| `03-Typography` | 字体使用说明 |
| `04-Clearspace-Usage` | 净空规范与错误示范 |
| `05-Applications` | 应用场景示意 |
| `06-Brand-Book` | **VI 规范书**（用浏览器打开 `Qingyi-VI-Guidelines.html`，可打印为 PDF） |
| `07-Export-Ready` | 常用场景快捷副本 |

## 快速使用
1. 网站页头 → `01-Logo/01-Primary/qingyi-logo-primary.svg`
2. 图标 / 头像 → `01-Logo/02-Seal/qingyi-seal.svg`
3. 深色背景 → `01-Logo/05-Reverse/qingyi-logo-reverse.svg`
4. 阅读完整规范 → `06-Brand-Book/Qingyi-VI-Guidelines.html`

## 色彩速查
- Jade `{JADE}`
- Ink `{INK}`
- Paper `{PAPER}`

## 声明
图形与组合为青意传媒原创。手册章节结构参考了公开品牌指南常见体例（如 [brandingstyleguides.com](https://brandingstyleguides.com/guide/) 所列手册的 Logo / Color / Type / Clear Space / Don'ts / Applications 组织方式），**未照抄** FIFA、King's College London、University of Tokyo、McDonald's 等任何第三方商标或专有图形。
"""


def build_typography_md() -> str:
    return """# Typography · 字体系统

## 品牌字标（已转曲）
Logo SVG 内中英文字形均已转换为 path，发布时无需嵌入字体文件。

## 延展排版（文档 / 网站 / PPT）

### 中文
| 用途 | 首选 | 回退 |
|------|------|------|
| 大标题 / 封面 | 宋体 Songti SC / STSong | SimSun |
| 正文 / UI | 苹方 PingFang SC | Microsoft YaHei |
| 注释 | 同上，字号更小、颜色 Mist | — |

### Latin
| 用途 | 首选 | 回退 |
|------|------|------|
| 标题配对 | Georgia / Source Serif 4 | Times New Roman |
| UI / 正文 | system-ui | Segoe UI, sans-serif |
| 色值 / 数据 | Consolas | ui-monospace |

## 字阶建议（数字端）
- H1: 32–40 / 1.2
- H2: 24–28 / 1.3
- Body: 15–16 / 1.7
- Caption: 12–13 / 1.5 · Mist 色

## 禁止
- Logo 字标改用圆体、手写体、艺术字。
- 中英文混排时英文使用过于装饰的 script 字体。
"""


def build_applications_html() -> str:
    return f"""<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8"/>
<title>青意传媒 · Applications</title>
<style>
  body {{ margin:0; font-family:"Microsoft YaHei",sans-serif; background:{PAPER}; color:{INK}; }}
  .wrap {{ max-width:960px; margin:0 auto; padding:40px 24px; }}
  h1 {{ font-family:"STSong","SimSun",serif; }}
  .card {{ background:#fff; border:1px solid #dce7e2; padding:28px; margin:20px 0; }}
  .card.dark {{ background:{INK}; color:{PAPER}; }}
  .biz {{
    display:flex; justify-content:space-between; align-items:center;
    height:180px; padding:28px 36px;
  }}
  .ppt {{
    aspect-ratio:16/9; display:flex; align-items:center; justify-content:center;
    background:linear-gradient(135deg,{PAPER},#fff);
  }}
  .ppt.dark {{ background:{INK}; }}
</style>
</head>
<body>
<div class="wrap">
  <h1>应用示意 Applications</h1>
  <p>示意用途，非正式印刷完稿。Logo 文件见 <code>01-Logo</code>。</p>

  <div class="card">
    <h3>名片 Business Card（示意）</h3>
    <div class="biz">
      <img src="../01-Logo/01-Primary/qingyi-logo-primary.svg" height="48" alt="logo"/>
      <div style="text-align:right;font-size:13px;line-height:1.6;color:{MIST}">
        青意传媒<br/>创意内容 · 主播孵化<br/>contact@qingyimedia.cn
      </div>
    </div>
  </div>

  <div class="card dark">
    <h3 style="color:{PAPER}">深色 PPT 封面（示意）</h3>
    <div class="ppt dark">
      <img src="../01-Logo/05-Reverse/qingyi-logo-reverse.svg" height="64" alt="logo"/>
    </div>
  </div>

  <div class="card">
    <h3>网站页头（示意）</h3>
    <div style="display:flex;align-items:center;justify-content:space-between;padding:12px 8px;border-bottom:1px solid #dce7e2">
      <img src="../01-Logo/01-Primary/qingyi-logo-primary.svg" height="32" alt="logo"/>
      <span style="font-size:13px;color:{MIST}">首页 · 主播 · 资讯 · 加入我们</span>
    </div>
  </div>

  <div class="card">
    <h3>社交头像（方印）</h3>
    <img src="../01-Logo/02-Seal/qingyi-seal.svg" width="96" height="96" alt="seal"/>
  </div>
</div>
</body>
</html>
"""


def main() -> None:
    dirs = ensure_dirs()
    font = load_font()
    print("font loaded")

    # Primary
    write(
        dirs["logo_primary"] / "qingyi-logo-primary.svg",
        build_horizontal_logo(font, seal_fill=JADE, text_fill=INK, filename_hint="primary"),
    )
    write(
        dirs["logo_primary"] / "qingyi-logo-primary-on-paper.svg",
        build_horizontal_logo(
            font, seal_fill=JADE, text_fill=INK, bg=PAPER, filename_hint="primary-on-paper"
        ),
    )

    # Seal
    write(dirs["logo_seal"] / "qingyi-seal.svg", build_seal_only(font, JADE))
    write(
        dirs["logo_seal"] / "qingyi-seal-on-ink.svg",
        build_seal_only(font, WHITE, bg=INK),
    )

    # Stacked
    write(
        dirs["logo_stacked"] / "qingyi-logo-stacked.svg",
        build_stacked_logo(font, JADE, INK),
    )

    # Mono
    write(
        dirs["logo_mono"] / "qingyi-logo-mono-ink.svg",
        build_horizontal_logo(font, seal_fill=INK, text_fill=INK, filename_hint="mono-ink"),
    )
    write(
        dirs["logo_mono"] / "qingyi-seal-mono-ink.svg",
        build_seal_only(font, INK),
    )

    # Reverse
    write(
        dirs["logo_reverse"] / "qingyi-logo-reverse.svg",
        build_horizontal_logo(
            font, seal_fill=WHITE, text_fill=WHITE, bg=INK, filename_hint="reverse"
        ),
    )
    write(
        dirs["logo_reverse"] / "qingyi-logo-reverse-transparent.svg",
        build_horizontal_logo(
            font, seal_fill=WHITE, text_fill=WHITE, filename_hint="reverse-transparent"
        ),
    )

    # Color
    write(dirs["color"] / "qingyi-color-palette.svg", build_color_palette_svg())
    write(dirs["color"] / "colors.json", build_colors_json())

    # Type
    write(dirs["type"] / "Typography.md", build_typography_md())

    # Usage
    write(dirs["usage"] / "qingyi-clearspace.svg", build_clearspace_svg(font))
    write(dirs["usage"] / "qingyi-donts.svg", build_donts_svg(font))

    # Applications
    write(dirs["apps"] / "applications.html", build_applications_html())

    # Brand book
    write(dirs["book"] / "Qingyi-VI-Guidelines.html", build_brand_book_html(dirs))

    # Export-ready copies
    import shutil

    for src, name in [
        (dirs["logo_primary"] / "qingyi-logo-primary.svg", "logo-header.svg"),
        (dirs["logo_seal"] / "qingyi-seal.svg", "logo-icon.svg"),
        (dirs["logo_reverse"] / "qingyi-logo-reverse.svg", "logo-dark-bg.svg"),
        (dirs["logo_stacked"] / "qingyi-logo-stacked.svg", "logo-stacked.svg"),
    ]:
        shutil.copy2(src, dirs["export"] / name)

    write(dirs["root"] / "README.md", build_readme())
    write(
        dirs["root"] / "LICENSE-NOTE.txt",
        "Qingyi Media original visual identity assets (2026).\n"
        "Structure of this manual follows common public brand-guideline practice.\n"
        "Do not copy third-party trademarks (FIFA, university marks, McDonald's, etc.).\n",
    )

    print("\\nDONE ->", DESKTOP)


if __name__ == "__main__":
    main()
