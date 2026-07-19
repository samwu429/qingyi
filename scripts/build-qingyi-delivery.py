# -*- coding: utf-8 -*-
"""
Build a practical 2-folder delivery on the Desktop:

  qingyi/SVG/  — production SVGs (transparent backgrounds only)
  qingyi/PDF/  — one usable VI guidelines PDF

Clear space is derived from this lockup's anatomy (not a copied 1/4 rule).
Reverse / white marks are transparent so they can sit on real dark UIs & photos.
"""

from __future__ import annotations

import base64
import io
import re
import shutil
import subprocess
import tempfile
from pathlib import Path

import numpy as np
from fontTools.misc.transform import Transform
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.transformPen import TransformPen
from fontTools.ttLib import TTFont
from PIL import Image

ROOT = Path.home() / "Desktop" / "qingyi"
SVG_DIR = ROOT / "SVG"
PDF_DIR = ROOT / "PDF"
WORK = Path(tempfile.mkdtemp(prefix="qingyi-delivery-"))

CONCEPT = Path(
    r"C:\Users\wu200\.cursor\projects\c-Users-wu200-Projects-qingyi\assets"
    r"\qingyi-logo-concept-03-seal-wordmark.png"
)

SAGE = "#689078"
INK = "#282828"
PAPER = "#F4F2EE"
MIST = "#7A7A7A"
BLACK = "#121212"
LIGHT = "#F2F5F3"
SEAL_BOX = (278, 386, 514, 622)
UPSCALE = 4
SEAL_SIZE = 200.0
GAP = 36.0  # seal → type gap in the master lockup
CN_H = 64.0
EN_H = 16.0
CN_EN_GAP = 14.0

# Clear-space unit: internal breathing room of the seal
# (frame inset ≈ distance from outer frame to「青」). At master seal=200 → X=44.
# Externally we protect the lockup with the same rhythm the seal already uses inside.
CLEAR_X_RATIO = 0.22  # X = 0.22 × seal edge


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


def text_paths(font, text, *, target_height, letter_spacing=0.0, tracking_em=0.0):
    cmap = font.getBestCmap()
    glyph_set = font.getGlyphSet()
    units = font["head"].unitsPerEm
    scale = target_height / units
    hmtx = font["hmtx"]
    ascents = []
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
    fragments, cursor = [], 0.0
    for ch in text:
        if ch == " ":
            cursor += units * (0.32 + tracking_em) * scale + letter_spacing
            continue
        name = cmap[ord(ch)]
        pen = SVGPathPen(glyph_set)
        tpen = TransformPen(pen, Transform(scale, 0, 0, -scale, cursor, y_max * scale))
        glyph_set[name].draw(tpen)
        d = pen.getCommands()
        if d:
            fragments.append(d)
        cursor += hmtx[name][0] * scale + letter_spacing + units * tracking_em * scale
    return fragments, cursor, y_max * scale


def paths_xml(fragments, fill):
    return "\n".join(f'    <path fill="{fill}" d="{d}"/>' for d in fragments)


def hex_rgb(h):
    h = h.lstrip("#")
    return int(h[0:2], 16), int(h[2:4], 16), int(h[4:6], 16)


def extract_seal_rgba() -> Image.Image:
    im = Image.open(CONCEPT).convert("RGB")
    crop = np.asarray(im.crop(SEAL_BOX), dtype=np.float32)
    luma = 0.2126 * crop[:, :, 0] + 0.7152 * crop[:, :, 1] + 0.0722 * crop[:, :, 2]
    ink = np.clip((228.0 - luma) / (228.0 - 118.0), 0.0, 1.0)
    ink = np.where(luma > 228.0, 0.0, ink)
    ink = np.where(ink < 0.08, 0.0, ink)
    rgba = np.zeros((crop.shape[0], crop.shape[1], 4), dtype=np.uint8)
    for c in range(3):
        rgba[:, :, c] = np.clip(crop[:, :, c], 0, 255).astype(np.uint8)
    rgba[:, :, 3] = np.clip(np.round(ink * 255.0), 0, 255).astype(np.uint8)
    out = Image.fromarray(rgba, "RGBA")
    out = out.resize((out.width * UPSCALE, out.height * UPSCALE), Image.Resampling.LANCZOS)
    arr = np.asarray(out).astype(np.float32)
    arr[:, :, 3] = np.where(arr[:, :, 3] < 18, 0, arr[:, :, 3])
    return Image.fromarray(arr.astype(np.uint8), "RGBA")


def recolor_seal(seal: Image.Image, color: str) -> Image.Image:
    arr = np.asarray(seal).astype(np.float32)
    alpha = arr[:, :, 3]
    luma = 0.2126 * arr[:, :, 0] + 0.7152 * arr[:, :, 1] + 0.0722 * arr[:, :, 2]
    pressure = np.clip((200.0 - luma) / 90.0, 0.55, 1.0)
    r, g, b = hex_rgb(color)
    out = np.zeros_like(arr)
    out[:, :, 0], out[:, :, 1], out[:, :, 2] = r, g, b
    out[:, :, 3] = np.clip(np.round(alpha * pressure), 0, 255)
    out[:, :, 3] = np.where(alpha < 1, 0, out[:, :, 3])
    return Image.fromarray(out.astype(np.uint8), "RGBA")


def png_b64(im: Image.Image) -> str:
    buf = io.BytesIO()
    im.save(buf, format="PNG", optimize=True)
    return base64.b64encode(buf.getvalue()).decode("ascii")


def seal_image_svg(b64: str, size: float, native) -> str:
    uri = f"data:image/png;base64,{b64}"
    return (
        f'  <g id="seal">\n'
        f'    <image href="{uri}" xlink:href="{uri}" x="0" y="0" '
        f'width="{size:.2f}" height="{size:.2f}" preserveAspectRatio="xMidYMid meet"/>\n'
        f"  </g>"
    )


def horizontal(seal_svg: str, font, *, text_color: str, title: str) -> str:
    """Transparent lockup — no background rect (production-safe)."""
    cn_frags, cn_w, cn_h = text_paths(font, "青意传媒", target_height=CN_H, letter_spacing=3.5)
    en_frags, en_w, en_h = text_paths(font, "QINGYI MEDIA", target_height=EN_H, tracking_em=0.28)
    text_block_h = cn_h + CN_EN_GAP + en_h
    text_top = (SEAL_SIZE - text_block_h) / 2
    total_w = SEAL_SIZE + GAP + max(cn_w, en_w)
    # Tight viewBox padding: just enough anti-alias margin, NOT a fake "stage".
    pad = 8
    en_scale_x = min(cn_w / en_w, 1.18) if en_w and en_w < cn_w * 0.98 else 1.0
    return f'''<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink"
     viewBox="0 0 {total_w + pad * 2:.1f} {SEAL_SIZE + pad * 2:.1f}"
     role="img" aria-label="青意传媒 Qingyi Media">
  <title>青意传媒 · {title}</title>
  <desc>Production lockup. Transparent background. Place on light or dark surfaces as specified.</desc>
  <g transform="translate({pad},{pad})">
{seal_svg}
    <g transform="translate({SEAL_SIZE + GAP},{text_top:.1f})">
{paths_xml(cn_frags, text_color)}
      <g transform="translate(0,{cn_h + CN_EN_GAP:.1f}) scale({en_scale_x:.4f},1)">
{paths_xml(en_frags, text_color)}
      </g>
    </g>
  </g>
</svg>
'''


def stacked(seal_svg: str, font, text_color: str) -> str:
    cn_frags, cn_w, cn_h = text_paths(font, "青意传媒", target_height=52, letter_spacing=3.0)
    en_frags, en_w, en_h = text_paths(font, "QINGYI MEDIA", target_height=14, tracking_em=0.26)
    gap = 28
    content_w = max(SEAL_SIZE, cn_w, en_w)
    total_h = SEAL_SIZE + gap + cn_h + 12 + en_h
    pad = 8
    en_scale_x = min(cn_w / en_w, 1.18) if en_w else 1.0
    return f'''<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink"
     viewBox="0 0 {content_w + pad * 2:.1f} {total_h + pad * 2:.1f}"
     role="img" aria-label="青意传媒 Qingyi Media">
  <title>青意传媒 · stacked</title>
  <g transform="translate({pad},{pad})">
    <g transform="translate({(content_w - SEAL_SIZE) / 2:.1f},0)">
{seal_svg}
    </g>
    <g transform="translate({(content_w - cn_w) / 2:.1f},{SEAL_SIZE + gap:.1f})">
{paths_xml(cn_frags, text_color)}
    </g>
    <g transform="translate({(content_w - en_w * en_scale_x) / 2:.1f},{SEAL_SIZE + gap + cn_h + 12:.1f}) scale({en_scale_x:.4f},1)">
{paths_xml(en_frags, text_color)}
    </g>
  </g>
</svg>
'''


def seal_only(b64: str, native, size: float = 512) -> str:
    """Transparent seal mark — no stage background."""
    pad = size * 0.04
    inner = size - pad * 2
    return f'''<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink"
     viewBox="0 0 {size} {size}" width="{size}" height="{size}"
     role="img" aria-label="青意传媒 青字印">
  <title>青意传媒 · Seal</title>
  <g transform="translate({pad},{pad})">
{seal_image_svg(b64, inner, native)}
  </g>
</svg>
'''


def write(path: Path, content: str) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(content, encoding="utf-8")
    print("wrote", path)


def find_edge() -> Path:
    for c in [
        Path(r"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe"),
        Path(r"C:\Program Files\Microsoft\Edge\Application\msedge.exe"),
    ]:
        if c.exists():
            return c
    raise FileNotFoundError("Edge not found")


def shot_html(edge: Path, html: str, out: Path, w: int, h: int) -> None:
    tmp = WORK / f"{out.stem}.html"
    tmp.write_text(html, encoding="utf-8")
    out.parent.mkdir(parents=True, exist_ok=True)
    subprocess.run(
        [str(edge), "--headless", "--disable-gpu", f"--window-size={w},{h}",
         f"--screenshot={out}", tmp.as_uri()],
        check=False, capture_output=True,
    )


def shot_svg_on_bg(edge: Path, svg: Path, out: Path, w: int, h: int, bg: str) -> None:
    html = f"""<!DOCTYPE html><html><body style="margin:0;background:{bg};
display:flex;align-items:center;justify-content:center;height:100vh">
<img src="{svg.as_uri()}" style="max-width:88%;max-height:70%"/>
</body></html>"""
    shot_html(edge, html, out, w, h)


def build_clearspace_diagram(primary_svg: Path, out_svg: Path) -> tuple[float, float, float]:
    """
    Clear space derived from seal internal inset (X = 0.22 × seal).

    Why not '1/4 of anything': that number is a handbook cliché. Here X mirrors
    the seal's own inner margin — the space the calligraphy already needs to
    breathe inside the frame — so the outer exclusion zone continues the same
    rhythm. Measured at master: seal=200 → X=44.
    """
    text = primary_svg.read_text(encoding="utf-8")
    m = re.search(r'viewBox="0 0 ([0-9.]+) ([0-9.]+)"', text)
    vb_w, vb_h = float(m.group(1)), float(m.group(2))
    body = re.sub(r"<\?xml[^>]*>|<svg[^>]*>|</svg>", "", text)
    body = re.sub(r"<title>.*?</title>|<desc>.*?</desc>", "", body, flags=re.S)

    # Logo content box inside viewBox (pad=8 in horizontal())
    pad = 8.0
    logo_w, logo_h = vb_w - pad * 2, vb_h - pad * 2
    seal = logo_h  # seal edge = logo height in this lockup
    x = seal * CLEAR_X_RATIO

    # Diagram layout
    margin = 56
    stage_w = logo_w + 2 * x + margin * 2
    stage_h = logo_h + 2 * x + margin * 2 + 72
    ox = margin + x
    oy = margin + x + 40

    # Scale logo group: strip outer translate pad by counter-shift
    diagram = f'''<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink"
     viewBox="0 0 {stage_w:.1f} {stage_h:.1f}">
  <rect width="100%" height="100%" fill="#FFFFFF"/>
  <text x="{margin}" y="28" font-family="Microsoft YaHei, sans-serif" font-size="15" fill="{INK}">Clear space · 净空单位 X</text>
  <text x="{margin}" y="48" font-family="Microsoft YaHei, sans-serif" font-size="11" fill="{MIST}">X = 方印边长 × 0.22（等于印面框到「青」字的内边距节奏）</text>

  <!-- exclusion zone -->
  <rect x="{ox - x:.1f}" y="{oy - x:.1f}" width="{logo_w + 2 * x:.1f}" height="{logo_h + 2 * x:.1f}"
        fill="#689078" fill-opacity="0.06" stroke="{SAGE}" stroke-width="1.25" stroke-dasharray="5 4"/>

  <!-- logo -->
  <g transform="translate({ox - pad:.1f},{oy - pad:.1f})">
{body}
  </g>

  <!-- X markers: left strip -->
  <rect x="{ox - x:.1f}" y="{oy:.1f}" width="{x:.1f}" height="{x:.1f}" fill="{SAGE}" opacity="0.35"/>
  <text x="{ox - x / 2:.1f}" y="{oy + x * 0.62:.1f}" text-anchor="middle"
        font-family="Georgia, serif" font-size="13" font-weight="700" fill="#3D5C4A">X</text>

  <!-- dimension note -->
  <text x="{margin}" y="{stage_h - 18:.1f}" font-family="Consolas, monospace" font-size="11" fill="{MIST}">master: seal={seal:.0f} → X={x:.0f} · scale X with the logo</text>
</svg>
'''
    out_svg.write_text(diagram, encoding="utf-8")
    return seal, x, logo_w


def build_minsize_diagram(edge: Path, primary: Path, seal: Path, out: Path) -> None:
    """Visual table of real minimum sizes — English is the limiting factor."""
    html = f"""<!DOCTYPE html>
<html><head><meta charset="utf-8"><style>
  body{{margin:0;background:#fff;font-family:"Microsoft YaHei",sans-serif;color:{INK};padding:36px 40px}}
  h2{{font-family:SimSun,serif;font-size:20px;margin:0 0 8px}}
  .sub{{color:{MIST};font-size:12px;margin-bottom:28px;max-width:640px;line-height:1.55}}
  .row{{display:flex;gap:28px;align-items:flex-end;margin:22px 0;padding:18px 0;border-bottom:1px solid #E8E4DE}}
  .label{{width:210px;font-size:13px;line-height:1.45}}
  .label b{{display:block;font-size:14px;margin-bottom:4px}}
  .label span{{color:{MIST};font-size:11px}}
  .ok{{color:#3D5C4A}} .warn{{color:#9A6B2F}}
  img{{display:block}}
</style></head><body>
  <h2>Minimum size · 最小尺寸（按可读性实测）</h2>
  <p class="sub">横排完整版的瓶颈是英文 QINGYI MEDIA：它只有方印边长的 8%。
  英文高度低于约 9–10px 时在屏幕上不可读——因此完整横排不能无限缩小。
  更小的场景请改用「仅方印」或「方印 + 中文」。</p>

  <div class="row">
    <div class="label"><b class="ok">完整横排 · 推荐最小</b>方印高 140px<br/><span>英文 ≈ 11px · 网站头图 / PPT</span></div>
    <img src="{primary.as_uri()}" height="140"/>
  </div>
  <div class="row">
    <div class="label"><b class="warn">完整横排 · 绝对下限</b>方印高 112px<br/><span>英文 ≈ 9px · 仅短时 UI，不用于印刷</span></div>
    <img src="{primary.as_uri()}" height="112"/>
  </div>
  <div class="row">
    <div class="label"><b class="ok">仅方印 · 推荐</b>32px<br/><span>头像 / 导航图标</span></div>
    <img src="{seal.as_uri()}" height="32"/>
  </div>
  <div class="row">
    <div class="label"><b class="warn">仅方印 · 下限</b>24px<br/><span>favicon 可用 16–32px</span></div>
    <img src="{seal.as_uri()}" height="24"/>
  </div>
  <p class="sub" style="margin-top:20px">印刷：完整横排宽度 ≥ <b>50mm</b>（推荐 60mm+）；方印边长 ≥ <b>8mm</b>。</p>
</body></html>"""
    shot_html(edge, html, out, 1100, 780)


def build_usage_dark(edge: Path, on_dark: Path, out: Path) -> None:
    """Show transparent on-dark logo correctly placed on real dark surfaces."""
    html = f"""<!DOCTYPE html>
<html><head><meta charset="utf-8"><style>
  body{{margin:0;font-family:"Microsoft YaHei",sans-serif;color:#eee}}
  .grid{{display:grid;grid-template-columns:1fr 1fr;height:100vh}}
  .panel{{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:18px;padding:32px}}
  .a{{background:#121212}} .b{{background:linear-gradient(145deg,#1a2a24,#0d1010 55%,#1c1814)}}
  img{{width:78%;max-width:420px}}
  p{{margin:0;font-size:13px;color:#9aa;text-align:center;max-width:360px;line-height:1.5}}
  h3{{margin:0;font-family:SimSun,serif;font-weight:600;font-size:18px;color:#ddd}}
</style></head><body>
<div class="grid">
  <div class="panel a">
    <h3>深色 UI / 视频底</h3>
    <img src="{on_dark.as_uri()}"/>
    <p>文件本身透明。叠在 #121212–#1a1a1a 或深色照片上。不要使用「自带黑底」的文件。</p>
  </div>
  <div class="panel b">
    <h3>深色渐变 / 封面</h3>
    <img src="{on_dark.as_uri()}"/>
    <p>背景需整体偏暗。中灰、花哨纹理上请加暗遮罩，或改用方印单色白。</p>
  </div>
</div>
</body></html>"""
    shot_html(edge, html, out, 1200, 640)


def build_donts(edge: Path, primary: Path, on_dark: Path, seal: Path, out: Path) -> None:
    html = f"""<!DOCTYPE html>
<html><head><meta charset="utf-8"><style>
  body{{margin:0;background:#fff;font-family:"Microsoft YaHei",sans-serif;color:{INK};padding:32px}}
  h2{{font-family:SimSun,serif;margin:0 0 20px}}
  .grid{{display:grid;grid-template-columns:repeat(3,1fr);gap:16px}}
  .card{{background:{PAPER};border:1px solid #E5E0D8;padding:16px;min-height:200px;
    display:flex;flex-direction:column;align-items:center;justify-content:center;gap:10px}}
  .card img{{max-width:88%;max-height:100px}}
  .x{{color:#B4534B;font-size:13px;text-align:center}}
  .bad-stretch img{{transform:scaleX(1.55) scaleY(0.55);max-height:70px}}
  .bad-rotate img{{transform:rotate(-16deg)}}
  .bad-gray{{background:#9AA89F}}
  .bad-gray img{{opacity:0.3}}
  .bad-crowd{{position:relative}}
  .bad-crowd .bar{{position:absolute;left:12%;right:12%;height:28px;background:{SAGE};opacity:.7}}
  .bad-crowd .bar1{{top:28%}} .bad-crowd .bar2{{bottom:32%;background:{INK};opacity:.55}}
</style></head><body>
<h2>Incorrect usage · 错误示范</h2>
<div class="grid">
  <div class="card bad-stretch"><img src="{primary.as_uri()}"/><div class="x">✕ 拉伸变形</div></div>
  <div class="card bad-rotate"><img src="{primary.as_uri()}"/><div class="x">✕ 旋转倾斜</div></div>
  <div class="card" style="background:#fff"><img src="{primary.as_uri()}" style="filter:hue-rotate(300deg) saturate(2)"/><div class="x">✕ 随意改色</div></div>
  <div class="card bad-gray"><img src="{primary.as_uri()}"/><div class="x">✕ 低对比背景</div></div>
  <div class="card bad-crowd"><div class="bar bar1"></div><div class="bar bar2"></div>
    <img src="{seal.as_uri()}" style="height:90px"/><div class="x">✕ 元素侵入净空</div></div>
  <div class="card" style="background:#888">
    <img src="{primary.as_uri()}" style="opacity:.85"/>
    <div class="x">✕ 浅色标放中灰底<br/>（应用 On Dark 透明版）</div>
  </div>
</div>
</body></html>"""
    shot_html(edge, html, out, 1100, 620)


def b64(path: Path) -> str:
    return base64.b64encode(path.read_bytes()).decode("ascii")


def img(path: Path, width=None) -> str:
    w = f' width="{width}"' if width else ""
    return f'<img src="data:image/png;base64,{b64(path)}"{w} style="max-width:100%;height:auto"/>'


def guidelines_html(figs: dict[str, Path]) -> str:
    return f"""<!DOCTYPE html>
<html lang="zh-CN"><head><meta charset="UTF-8"/>
<title>青意传媒 · 视觉识别规范</title>
<style>
  @page {{ size: A4; margin: 16mm 15mm; }}
  body {{ margin:0; font-family:"PingFang SC","Microsoft YaHei",sans-serif; color:{INK};
    font-size:10.5pt; line-height:1.65; }}
  h1,h2,h3 {{ font-family:"Songti SC","STSong","SimSun",serif; font-weight:700; }}
  h1 {{ font-size:26pt; letter-spacing:.05em; margin:0 0 .35em; }}
  h2 {{ font-size:15pt; margin:1.4em 0 .55em; padding-bottom:.2em; border-bottom:2px solid {SAGE}; break-after:avoid; }}
  h3 {{ font-size:11.5pt; color:#4F735E; margin:1em 0 .4em; break-after:avoid; }}
  .cover {{ min-height:88vh; display:flex; flex-direction:column; justify-content:center; page-break-after:always; }}
  .eyebrow {{ letter-spacing:.2em; text-transform:uppercase; color:{MIST}; font-size:9pt; }}
  .lede {{ color:{MIST}; max-width:36em; }}
  .meta {{ color:{MIST}; font-size:9pt; margin-top:1em; }}
  .figure {{ margin:.7em 0 1em; padding:16px; background:{PAPER}; border:1px solid #E5E0D8; text-align:center; break-inside:avoid; }}
  .figure.dark {{ background:{BLACK}; border-color:{BLACK}; }}
  .grid-2 {{ display:grid; grid-template-columns:1fr 1fr; gap:12px; }}
  table {{ width:100%; border-collapse:collapse; font-size:9.5pt; }}
  th,td {{ border-bottom:1px solid #E5E0D8; padding:7px 6px; text-align:left; vertical-align:top; }}
  th {{ color:{MIST}; font-size:8.5pt; }}
  ul {{ padding-left:1.15em; }} li {{ margin:.22em 0; }}
  .dont {{ color:#B4534B; }} .do {{ color:#3D5C4A; }}
  code {{ font-family:Consolas,monospace; font-size:8.5pt; }}
  pre {{ background:{PAPER}; padding:12px; font-size:9pt; overflow:auto; }}
</style></head><body>

<section class="cover">
  <p class="eyebrow">Qingyi Media · Visual Identity · Practical Guide</p>
  <h1>青意传媒</h1>
  <p class="lede">给协作方直接使用的视觉识别规范。标志文件均为透明底 SVG；深色场景用 On Dark，不要用「自带黑底」的文件。</p>
  <div class="figure">{img(figs["primary"], 480)}</div>
  <p class="meta">青意传媒 · 创意内容 / 主播孵化 / 平台分发<br/>文件：SVG/（标志）+ PDF/（本规范）· v2.1</p>
</section>

<h2>1. 怎么选文件（先看这个）</h2>
<table>
  <tr><th>场景</th><th>用这个文件</th><th>不要</th></tr>
  <tr><td>白底 / 浅色网页 / 文档 / 名片</td><td><code>QingyiMedia_Logo_Primary.svg</code></td><td>On Dark</td></tr>
  <tr><td>深色 UI、深色 PPT、视频片头、深色照片</td><td><code>QingyiMedia_Logo_OnDark.svg</code>（透明）</td><td>浅色主标硬叠；自带黑底文件</td></tr>
  <tr><td>单色印刷 / 发票 / 印章区</td><td><code>QingyiMedia_Logo_Mono_Black.svg</code></td><td>彩色扫印（网点会脏）</td></tr>
  <tr><td>头像、favicon、App 图标</td><td><code>QingyiMedia_Mark.svg</code> / <code>Favicon.svg</code></td><td>强行塞完整横排</td></tr>
  <tr><td>方版海报中轴</td><td><code>QingyiMedia_Logo_Stacked.svg</code></td><td>—</td></tr>
  <tr><td>深色上的方印</td><td><code>QingyiMedia_Mark_White.svg</code>（透明）</td><td>青绿方印直接放深底（飞白会融进背景）</td></tr>
</table>
<p><strong>On Dark 文件没有背景色</strong>——你把它叠在自己的深色底上。规范里的深色示意只是演示，不是文件自带的。</p>
<div class="figure dark">{img(figs["ondark_demo"])}</div>

<h2>2. Logo 系统</h2>
<h3>2.1 主标识 Primary（浅底）</h3>
<div class="figure">{img(figs["primary"], 500)}
<p class="meta">QingyiMedia_Logo_Primary.svg · 透明底 · Sage 印 + Ink 字</p></div>

<h3>2.2 On Dark（深底用 · 透明）</h3>
<div class="figure dark">{img(figs["ondark"], 500)}
<p class="meta" style="color:#bbb">QingyiMedia_Logo_OnDark.svg · 透明浅色标 · 请放在深色表面上</p></div>

<h3>2.3 方印 / 竖式 / 单色</h3>
<div class="grid-2">
  <div class="figure">{img(figs["seal"], 140)}<p class="meta">Mark.svg</p></div>
  <div class="figure">{img(figs["stacked"], 160)}<p class="meta">Stacked.svg</p></div>
</div>
<div class="figure">{img(figs["mono"], 420)}<p class="meta">Mono_Black.svg</p></div>

<h2>3. 净空 Clear space</h2>
<p>净空单位 <strong>X = 方印边长 × 0.22</strong>。这个比例取自印面自身：框到「青」字的内边距节奏——外面留白延续印面内部的呼吸感，而不是套用「任意边长的 1/4」。</p>
<p>Logo 四周至少留出 <strong>1X</strong>；营销主画面建议 <strong>1.5X</strong>。按钮、照片边缘、其他 Logo 不得进入该区域。</p>
<div class="figure">{img(figs["clearspace"])}</div>

<h2>4. 最小尺寸</h2>
<p>完整横排的限制来自英文：英文高度 = 方印 × 8%。屏幕上英文低于约 9px 就不可读，所以完整版不能无限缩小；更小请改方印或去掉英文。</p>
<div class="figure">{img(figs["minsize"])}</div>
<table>
  <tr><th>用途</th><th>最小</th><th>推荐</th></tr>
  <tr><td>完整横排（含英文）· 数字</td><td>方印高 112px</td><td>方印高 ≥ 140px</td></tr>
  <tr><td>完整横排 · 印刷宽度</td><td>50mm</td><td>≥ 60mm</td></tr>
  <tr><td>仅方印 · 数字</td><td>24px</td><td>≥ 32px</td></tr>
  <tr><td>仅方印 · 印刷</td><td>8mm</td><td>≥ 10mm</td></tr>
  <tr><td>Favicon</td><td>16px</td><td>32px</td></tr>
</table>

<h2>5. 色彩</h2>
<div class="grid-2">
  <div class="figure" style="background:{SAGE};color:#fff;padding:28px"><strong>Sage 印面</strong><br/><code style="color:#e8f0ea">{SAGE}</code><br/>RGB 104,144,120</div>
  <div class="figure" style="background:{INK};color:#fff;padding:28px"><strong>Ink 字标</strong><br/><code style="color:#ddd">{INK}</code><br/>RGB 40,40,40</div>
</div>
<p>浅底用 Primary（青绿印 + 炭黑字）。深底用 On Dark（浅色透明标）。不要把青绿扫印直接放在深色或花哨底上——飞白纹理会丢失。</p>

<h2>6. 错误示范</h2>
<div class="figure">{img(figs["donts"])}</div>
<ul>
  <li class="dont">禁止拉伸、旋转、改色、加投影/描边/渐变</li>
  <li class="dont">禁止用光滑几何框替换扫印方印</li>
  <li class="dont">禁止浅色主标直接放中灰 / 浅深不明的照片上</li>
  <li class="dont">禁止把「演示用黑底图」当成反白文件发给制作方</li>
  <li class="do">允许：透明 Primary 叠浅底；透明 On Dark 叠深底</li>
</ul>

<h2>7. 交付清单</h2>
<pre>qingyi/
├── SVG/
│   ├── QingyiMedia_Logo_Primary.svg      ← 默认浅底
│   ├── QingyiMedia_Logo_OnDark.svg       ← 深底（透明）
│   ├── QingyiMedia_Logo_Mono_Black.svg
│   ├── QingyiMedia_Logo_Mono_White.svg   ← 深底单色备选
│   ├── QingyiMedia_Logo_Stacked.svg
│   ├── QingyiMedia_Mark.svg
│   ├── QingyiMedia_Mark_Black.svg
│   ├── QingyiMedia_Mark_White.svg        ← 透明
│   ├── QingyiMedia_Wordmark.svg
│   └── QingyiMedia_Favicon.svg
└── PDF/
    └── QingyiMedia_VI_Guidelines.pdf     ← 本文件
</pre>
<p class="meta">© 2026 青意传媒 · 协作直接使用 SVG 源文件，按上表选对版本即可。</p>
</body></html>
"""


def main() -> None:
    if not CONCEPT.exists():
        raise SystemExit(f"Concept missing: {CONCEPT}")

    edge = find_edge()
    font = load_font()

    raw = extract_seal_rgba()
    sage = recolor_seal(raw, SAGE)
    ink = recolor_seal(raw, INK)
    white = recolor_seal(raw, LIGHT)
    native = sage.size
    b64_sage, b64_ink, b64_white = png_b64(sage), png_b64(ink), png_b64(white)
    seal_sage = seal_image_svg(b64_sage, SEAL_SIZE, native)
    seal_ink = seal_image_svg(b64_ink, SEAL_SIZE, native)
    seal_white = seal_image_svg(b64_white, SEAL_SIZE, native)

    # Stage SVG dir
    stage_svg = WORK / "SVG"
    stage_svg.mkdir()

    files = {
        "QingyiMedia_Logo_Primary.svg": horizontal(seal_sage, font, text_color=INK, title="primary"),
        "QingyiMedia_Logo_OnDark.svg": horizontal(seal_white, font, text_color=LIGHT, title="on-dark-transparent"),
        "QingyiMedia_Logo_Mono_Black.svg": horizontal(seal_ink, font, text_color=INK, title="mono-black"),
        "QingyiMedia_Logo_Mono_White.svg": horizontal(seal_white, font, text_color=LIGHT, title="mono-white"),
        "QingyiMedia_Logo_Stacked.svg": stacked(seal_sage, font, INK),
        "QingyiMedia_Mark.svg": seal_only(b64_sage, native),
        "QingyiMedia_Mark_Black.svg": seal_only(b64_ink, native),
        "QingyiMedia_Mark_White.svg": seal_only(b64_white, native),  # transparent!
        "QingyiMedia_Favicon.svg": seal_only(b64_sage, native, size=64),
    }
    for name, content in files.items():
        write(stage_svg / name, content)

    # Wordmark
    cn_frags, cn_w, cn_h = text_paths(font, "青意传媒", target_height=64, letter_spacing=3.5)
    en_frags, en_w, en_h = text_paths(font, "QINGYI MEDIA", target_height=16, tracking_em=0.28)
    en_scale = min(cn_w / en_w, 1.18) if en_w else 1.0
    pad = 8
    write(
        stage_svg / "QingyiMedia_Wordmark.svg",
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

    # Diagrams
    figs = WORK / "figs"
    figs.mkdir()
    clear_svg = WORK / "clearspace.svg"
    seal_m, x_unit, logo_w = build_clearspace_diagram(stage_svg / "QingyiMedia_Logo_Primary.svg", clear_svg)
    print(f"clearspace: seal={seal_m:.0f} X={x_unit:.1f} logo_w={logo_w:.1f}")

    shot_svg_on_bg(edge, stage_svg / "QingyiMedia_Logo_Primary.svg", figs / "primary.png", 1100, 480, PAPER)
    shot_svg_on_bg(edge, stage_svg / "QingyiMedia_Logo_OnDark.svg", figs / "ondark.png", 1100, 480, BLACK)
    shot_svg_on_bg(edge, stage_svg / "QingyiMedia_Mark.svg", figs / "seal.png", 520, 520, PAPER)
    shot_svg_on_bg(edge, stage_svg / "QingyiMedia_Logo_Stacked.svg", figs / "stacked.png", 520, 700, PAPER)
    shot_svg_on_bg(edge, stage_svg / "QingyiMedia_Logo_Mono_Black.svg", figs / "mono.png", 1100, 480, PAPER)
    shot_svg_on_bg(edge, clear_svg, figs / "clearspace.png", 1000, 620, "#FFFFFF")
    build_minsize_diagram(
        edge,
        stage_svg / "QingyiMedia_Logo_Primary.svg",
        stage_svg / "QingyiMedia_Mark.svg",
        figs / "minsize.png",
    )
    build_usage_dark(edge, stage_svg / "QingyiMedia_Logo_OnDark.svg", figs / "ondark_demo.png")
    build_donts(
        edge,
        stage_svg / "QingyiMedia_Logo_Primary.svg",
        stage_svg / "QingyiMedia_Logo_OnDark.svg",
        stage_svg / "QingyiMedia_Mark.svg",
        figs / "donts.png",
    )

    html_path = WORK / "guidelines.html"
    html_path.write_text(
        guidelines_html({
            "primary": figs / "primary.png",
            "ondark": figs / "ondark.png",
            "ondark_demo": figs / "ondark_demo.png",
            "seal": figs / "seal.png",
            "stacked": figs / "stacked.png",
            "mono": figs / "mono.png",
            "clearspace": figs / "clearspace.png",
            "minsize": figs / "minsize.png",
            "donts": figs / "donts.png",
        }),
        encoding="utf-8",
    )

    pdf_tmp = WORK / "QingyiMedia_VI_Guidelines.pdf"
    subprocess.run(
        [str(edge), "--headless", "--disable-gpu",
         f"--print-to-pdf={pdf_tmp}", "--no-pdf-header-footer", html_path.as_uri()],
        check=False, capture_output=True,
    )
    if not pdf_tmp.exists() or pdf_tmp.stat().st_size < 20_000:
        raise SystemExit("PDF failed")

    # Replace Desktop/qingyi with clean 2-folder pack
    staging = Path.home() / "Desktop" / "_qingyi_staging"
    if staging.exists():
        shutil.rmtree(staging)
    (staging / "SVG").mkdir(parents=True)
    (staging / "PDF").mkdir(parents=True)
    for f in stage_svg.glob("*.svg"):
        shutil.copy2(f, staging / "SVG" / f.name)
    shutil.copy2(pdf_tmp, staging / "PDF" / "QingyiMedia_VI_Guidelines.pdf")

    ROOT.mkdir(parents=True, exist_ok=True)
    for child in list(ROOT.iterdir()):
        if child.is_dir():
            shutil.rmtree(child, ignore_errors=True)
        else:
            try:
                child.unlink()
            except OSError:
                pass
    for sub in ("SVG", "PDF"):
        dest = ROOT / sub
        if dest.exists():
            shutil.rmtree(dest, ignore_errors=True)
        shutil.copytree(staging / sub, dest)
    shutil.rmtree(staging, ignore_errors=True)
    shutil.rmtree(WORK, ignore_errors=True)

    print("DONE practical delivery")
    print(" ", ROOT / "SVG")
    for p in sorted((ROOT / "SVG").iterdir()):
        print("   ", p.name)
    print(" ", ROOT / "PDF" / "QingyiMedia_VI_Guidelines.pdf",
          f"({(ROOT / 'PDF' / 'QingyiMedia_VI_Guidelines.pdf').stat().st_size // 1024} KB)")


if __name__ == "__main__":
    main()
