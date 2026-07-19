# -*- coding: utf-8 -*-
"""
Sync VI guidelines / brand book / clearspace / donts / colors / tokens
to the current scanned brush-seal logo system (v2.0).
"""

from __future__ import annotations

import json
import re
import shutil
from pathlib import Path

DESKTOP = Path.home() / "Desktop" / "qingyi"
SOURCE = DESKTOP / "01_Logo_Source"
EXPORTS = DESKTOP / "02_Exports"
EXPORT_READY = DESKTOP / "07-Export-Ready"

SAGE = "#689078"
SAGE_DEEP = "#4F735E"
SAGE_SOFT = "#8AA996"
INK = "#282828"
INK_SOFT = "#5A5A5A"
MIST = "#7A7A7A"
PAPER = "#F4F2EE"
WHITE = "#FFFFFF"
BLACK = "#0A0A0A"
DANGER = "#B4534B"
WRONG = "#E85D4C"


def extract_inner(svg_text: str) -> tuple[str, float, float]:
    m = re.search(r'viewBox="0 0 ([0-9.]+) ([0-9.]+)"', svg_text)
    if not m:
        raise ValueError("no viewBox")
    w, h = float(m.group(1)), float(m.group(2))
    body = re.sub(r"<\?xml[^>]*>", "", svg_text)
    body = re.sub(r"<svg[^>]*>", "", body, count=1)
    body = re.sub(r"</svg>\s*$", "", body)
    body = re.sub(r"<title>.*?</title>", "", body, flags=re.S)
    body = re.sub(r"<desc>.*?</desc>", "", body, flags=re.S)
    body = re.sub(r'<rect[^>]*width="100%"[^>]*/>', "", body)
    body = re.sub(r'<rect[^>]*fill="#0A0A0A"[^>]*/>', "", body)
    return body.strip(), w, h


def wrap(inner: str, src_w: float, src_h: float, x: float, y: float, target_h: float) -> str:
    scale = target_h / src_h
    return f'<g transform="translate({x},{y}) scale({scale:.5f})">{inner}</g>'


def write(path: Path, content: str) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(content, encoding="utf-8")
    print("wrote", path.relative_to(DESKTOP))


def build_color_palette() -> str:
    swatches = [
        ("Qingyi Sage", SAGE, "Seal / Primary", "HEX 689078 · RGB 104,144,120"),
        ("Sage Deep", SAGE_DEEP, "Primary Dark", "HEX 4F735E · RGB 79,115,94"),
        ("Sage Soft", SAGE_SOFT, "Accent / Guides", "HEX 8AA996 · RGB 138,169,150"),
        ("Ink", INK, "Wordmark / Type", "HEX 282828 · RGB 40,40,40"),
        ("Ink Soft", INK_SOFT, "Secondary Type", "HEX 5A5A5A · RGB 90,90,90"),
        ("Mist", MIST, "Caption / Meta", "HEX 7A7A7A · RGB 122,122,122"),
        ("Paper", PAPER, "Background", "HEX F4F2EE · RGB 244,242,238"),
        ("White", WHITE, "Background / Reverse", "HEX FFFFFF · RGB 255,255,255"),
    ]
    row_h = 72
    height = 40 + len(swatches) * row_h
    rows = []
    for i, (name, hex_c, role, codes) in enumerate(swatches):
        y = 40 + i * row_h
        rows.append(
            f'''  <g transform="translate(40,{y})">
    <rect width="120" height="56" fill="{hex_c}" stroke="#E5E0D8" stroke-width="1"/>
    <text x="140" y="22" font-family="Microsoft YaHei, sans-serif" font-size="16" fill="{INK}">{name}</text>
    <text x="140" y="42" font-family="Consolas, monospace" font-size="12" fill="{MIST}">{role} · {codes}</text>
  </g>'''
        )
    return f'''<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 720 {height}" width="720" height="{height}">
  <rect width="100%" height="100%" fill="{PAPER}"/>
  <text x="40" y="28" font-family="Songti SC, STSong, SimSun, serif" font-size="20" fill="{INK}">青意传媒 · Color System</text>
{chr(10).join(rows)}
</svg>
'''


def build_clearspace(primary_svg: str) -> str:
    inner, pw, ph = extract_inner(primary_svg)
    target_h = 100.0
    scale = target_h / ph
    logo_w = pw * scale
    logo_h = target_h
    x = logo_h / 4  # X = 1/4 of seal height ≈ logo height here
    pad = 48
    ox = pad + x
    oy = pad + x + 28
    vb_w = logo_w + 2 * x + pad * 2
    vb_h = logo_h + 2 * x + pad * 2 + 20
    return f'''<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink"
     viewBox="0 0 {vb_w:.1f} {vb_h:.1f}">
  <rect width="100%" height="100%" fill="{WHITE}"/>
  <text x="{pad}" y="28" font-family="Microsoft YaHei, sans-serif" font-size="14" fill="{INK}">Clear Space · 净空区 = X（方印边长的 1/4）</text>
  <rect x="{ox - x:.1f}" y="{oy - x:.1f}" width="{logo_w + 2 * x:.1f}" height="{logo_h + 2 * x:.1f}"
        fill="none" stroke="{SAGE_SOFT}" stroke-width="1" stroke-dasharray="4 3"/>
  {wrap(inner, pw, ph, ox, oy, target_h)}
  <rect x="{ox - x:.1f}" y="{oy:.1f}" width="{x:.1f}" height="{x:.1f}" fill="{SAGE}" opacity="0.28"/>
  <text x="{ox - x / 2:.1f}" y="{oy + x * 0.68:.1f}" text-anchor="middle"
        font-family="Georgia, serif" font-size="11" fill="{SAGE_DEEP}">X</text>
</svg>
'''


def build_donts(primary_svg: str, seal_svg: str) -> str:
    p_inner, pw, ph = extract_inner(primary_svg)
    s_inner, sw, sh = extract_inner(seal_svg)
    cases = [
        ("拉伸变形", "stretch"),
        ("随意改色", "recolor"),
        ("添加阴影", "shadow"),
        ("旋转倾斜", "rotate"),
        ("低对比背景", "contrast"),
        ("拥挤遮挡", "crowd"),
    ]
    tile, cols, rows, gap, pad = 220, 3, 2, 24, 40
    w = pad * 2 + cols * tile + (cols - 1) * gap
    h = pad * 2 + 40 + rows * (tile + 36) + (rows - 1) * gap
    tiles = []
    for i, (label, kind) in enumerate(cases):
        col, row = i % cols, i // cols
        x = pad + col * (tile + gap)
        y = pad + 40 + row * (tile + 36 + gap)
        bg = "#9AA89F" if kind == "contrast" else PAPER
        if kind == "stretch":
            logo = (
                f'<g transform="translate(10,85) '
                f'scale({(tile - 40) / pw:.5f},{(56) / ph:.5f})">{p_inner}</g>'
            )
        elif kind == "rotate":
            logo = (
                f'<g transform="translate(110,120) rotate(-18) '
                f'translate(-{pw/2:.1f},-{ph/2:.1f}) scale({90/ph:.5f})">{p_inner}</g>'
            )
        elif kind == "recolor":
            logo = (
                f'<g style="filter:hue-rotate(300deg) saturate(2.2)">'
                f"{wrap(s_inner, sw, sh, 70, 50, 100)}</g>"
            )
        elif kind == "contrast":
            logo = f'<g opacity="0.28">{wrap(s_inner, sw, sh, 70, 50, 100)}</g>'
        elif kind == "crowd":
            logo = (
                wrap(s_inner, sw, sh, 70, 50, 100)
                + f'<rect x="40" y="40" width="140" height="40" fill="{SAGE}" opacity="0.65"/>'
                + f'<rect x="40" y="150" width="140" height="28" fill="{INK}" opacity="0.55"/>'
            )
        elif kind == "shadow":
            logo = (
                f'<ellipse cx="110" cy="165" rx="70" ry="10" fill="#000" opacity="0.28"/>'
                + wrap(p_inner, pw, ph, 20, 60, 56)
            )
        else:
            logo = wrap(s_inner, sw, sh, 70, 50, 100)

        tiles.append(
            f'''  <g transform="translate({x},{y})">
    <rect width="{tile}" height="{tile}" fill="{bg}" stroke="#E5E0D8"/>
    {logo}
    <text x="{tile/2}" y="{tile + 22}" text-anchor="middle"
          font-family="Microsoft YaHei, sans-serif" font-size="13" fill="{DANGER}">✕ {label}</text>
  </g>'''
        )
    return f'''<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink"
     viewBox="0 0 {w} {h}">
  <rect width="100%" height="100%" fill="{WHITE}"/>
  <text x="40" y="36" font-family="Songti SC, STSong, SimSun, serif" font-size="20" fill="{INK}">Incorrect Usage · 错误示范</text>
{chr(10).join(tiles)}
</svg>
'''


def brand_book_html() -> str:
    return f'''<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1"/>
<title>青意传媒 · Visual Identity Guidelines</title>
<style>
  :root {{
    --sage: {SAGE};
    --sage-deep: {SAGE_DEEP};
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
    box-shadow: 0 0 0 1px rgba(40,40,40,0.06);
  }}
  h1, h2, h3 {{ font-family: "Songti SC", "STSong", "SimSun", serif; font-weight: 700; }}
  h1 {{ font-size: 2.4rem; letter-spacing: 0.04em; margin: 0 0 0.4em; }}
  h2 {{
    font-size: 1.5rem;
    margin: 2.8rem 0 1rem;
    padding-bottom: 0.4rem;
    border-bottom: 2px solid var(--sage);
  }}
  h3 {{ font-size: 1.1rem; margin: 1.6rem 0 0.6rem; color: var(--sage-deep); }}
  .eyebrow {{
    font-size: 0.75rem;
    letter-spacing: 0.22em;
    text-transform: uppercase;
    color: var(--mist);
    margin-bottom: 1rem;
  }}
  .lede {{ font-size: 1.05rem; color: var(--mist); max-width: 40em; }}
  .meta {{ margin-top: 2rem; font-size: 0.85rem; color: var(--mist); }}
  .figure {{
    margin: 1.2rem 0 1.6rem;
    padding: 28px;
    border: 1px solid rgba(40,40,40,0.08);
    background: var(--paper);
    text-align: center;
  }}
  .figure img, .figure object {{ max-width: 100%; height: auto; }}
  .grid-2 {{ display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }}
  .swatch {{
    display: flex; gap: 14px; align-items: center;
    padding: 12px; border: 1px solid rgba(40,40,40,0.08);
  }}
  .swatch .chip {{ width: 56px; height: 56px; flex-shrink: 0; }}
  .swatch code {{ font-size: 0.8rem; color: var(--mist); }}
  table {{ width: 100%; border-collapse: collapse; font-size: 0.92rem; }}
  th, td {{ border-bottom: 1px solid rgba(40,40,40,0.1); padding: 10px 8px; text-align: left; vertical-align: top; }}
  th {{ color: var(--mist); font-weight: 600; font-size: 0.8rem; }}
  .do {{ color: var(--sage-deep); }}
  .dont {{ color: {DANGER}; }}
  ul {{ padding-left: 1.2rem; }}
  li {{ margin: 0.35rem 0; }}
  .toc a {{ color: var(--sage-deep); text-decoration: none; }}
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
  <p class="eyebrow">Visual Identity Guidelines · 2026 · v2.0</p>
  <h1>青意传媒</h1>
  <p class="lede">Qingyi Media Brand VI Manual — 以「毛笔感方印 + 宋体字标横排」为主标识的视觉识别规范。方印自概念图扫描提取，保留飞白墨色；字标为矢量宋体，形成有机印面与清晰字标的对比。</p>
  <p class="meta">
    品牌：青意传媒（青意贸易（福建福清市）有限公司）<br/>
    定位：创意内容产业 · 主播孵化 · 平台分发与变现<br/>
    主标识方案：③ 扫印毛笔方印「青」+ 字标「青意传媒 / QINGYI MEDIA」<br/>
    文件版本：v2.0 · 印面为概念图扫描纹理；字标矢量转曲
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
  <p>青意传媒是面向直播与短视频的创意内容公会。视觉识别同时传达「文化根基」与「当代媒介专业度」：毛笔感方印承载汉字「青」的辨识锚点与手作温度，宋体字标提供高端编辑气质，英文大写字距展开形成国际化阅读层。</p>
  <h3>设计原则</h3>
  <ul>
    <li><strong>有机印面</strong>：方印保留飞白 / 墨色不均，勿替换为光滑几何描边。</li>
    <li><strong>清晰字标</strong>：中英文案保持矢量锐利，与印面形成质感对比。</li>
    <li><strong>可缩放</strong>：方印可独立作为 App / 头像 / 聊天气球图标（小尺寸用 PNG 母版）。</li>
    <li><strong>青绿为唯一主色</strong>：印面 Sage <code>{SAGE}</code>，字标炭黑 <code>{INK}</code>；不引入第二强调色。</li>
  </ul>

  <h2 id="logo">2. Logo 系统</h2>
  <h3>2.1 主标识 Primary Lockup（横排）</h3>
  <p>左：扫印方印「青」；右上：青意传媒；右下：QINGYI MEDIA。默认用于网站页头、名片、PPT 封面、合同页眉。</p>
  <div class="figure">
    <img src="figures/brandbook-primary.png" alt="Primary logo" width="520"/>
    <p class="meta" style="margin-top:12px">源文件：<code>01_Logo_Source/QingyiMedia_Logo_Primary_Horizontal.svg</code></p>
  </div>

  <h3>2.2 方印 Seal（独立）</h3>
  <p>空间不足或需要强符号时使用（favicon、聊天入口、社交媒体头像、水印）。高清母版见 <code>01_Logo_Source/assets/QingyiMedia_Seal_Brush_*.png</code>。</p>
  <div class="figure">
    <img src="figures/brandbook-seal.png" alt="Seal" width="200"/>
    <p class="meta" style="margin-top:12px">源文件：<code>01_Logo_Source/QingyiMedia_Mark_Jade.svg</code></p>
  </div>

  <h3>2.3 竖式 Stacked</h3>
  <p>用于正方形版心、海报中轴、移动端启动页。</p>
  <div class="figure">
    <img src="figures/brandbook-stacked.png" alt="Stacked logo" width="220"/>
    <p class="meta" style="margin-top:12px">源文件：<code>01_Logo_Source/QingyiMedia_Logo_Stacked.svg</code></p>
  </div>

  <h3>2.4 单色 / 反白</h3>
  <div class="grid-2">
    <div class="figure">
      <img src="figures/brandbook-mono.png" alt="Mono ink" width="280"/>
      <p>单色墨黑 · 印刷单色稿<br/><span class="meta">QingyiMedia_Logo_Monochrome_Black.svg</span></p>
    </div>
    <div class="figure" style="background:{BLACK}">
      <img src="figures/brandbook-reverse.png" alt="Reverse" width="280"/>
      <p style="color:{PAPER}">反白 · 深色背景<br/><span style="opacity:.75">QingyiMedia_Logo_Primary_Reversed.svg</span></p>
    </div>
  </div>

  <h2 id="color">3. 色彩系统</h2>
  <div class="figure">
    <img src="../02-Color/qingyi-color-palette.svg" alt="Color palette"/>
  </div>
  <div class="swatch"><div class="chip" style="background:{SAGE}"></div><div><strong>Qingyi Sage</strong><br/><code>{SAGE} · RGB 104,144,120 · 印面主色</code></div></div>
  <div class="swatch"><div class="chip" style="background:{INK}"></div><div><strong>Ink</strong><br/><code>{INK} · 字标 / 正文</code></div></div>
  <div class="swatch"><div class="chip" style="background:{PAPER};border:1px solid #ddd"></div><div><strong>Paper</strong><br/><code>{PAPER} · 页面底色</code></div></div>
  <p>方印与「青」字使用 Sage；中英文案使用 Ink。勿将方印改为朱红传统印章色——本品牌是「当代青绿毛笔印」，不是「朱红印泥」。</p>

  <h2 id="type">4. 字体系统</h2>
  <table>
    <tr><th>层级</th><th>中文</th><th>英文 / 数字</th><th>用途</th></tr>
    <tr><td>品牌 / 标题</td><td>宋体（Songti SC / STSong / SimSun）</td><td>Georgia / Source Serif</td><td>Logo 字标、封面标题</td></tr>
    <tr><td>正文</td><td>苹方 / 微软雅黑</td><td>system-ui / Segoe UI</td><td>网站、文档、UI</td></tr>
    <tr><td>数据 / 代码</td><td>—</td><td>Consolas / Tabular nums</td><td>后台数据表、色值标注</td></tr>
  </table>
  <p>Logo 字标已转曲（path）；方印为扫描 PNG 嵌入 SVG，不依赖终端字体即可正确显示。文案排版请优先使用上述字体栈。</p>

  <h2 id="space">5. 净空与最小尺寸</h2>
  <div class="figure">
    <img src="../04-Clearspace-Usage/qingyi-clearspace.svg" alt="Clear space"/>
  </div>
  <ul>
    <li><strong>净空 X</strong>：方印边长的 1/4。Logo 四周不得侵入文字、按钮、图片边缘。</li>
    <li><strong>数字最小宽度</strong>：横排主标识 ≥ 120px；方印独立 ≥ 24px（favicon 可用 16–32px）。</li>
    <li><strong>印刷最小宽度</strong>：横排 ≥ 28mm；方印 ≥ 8mm。大幅面印刷优先使用 <code>assets</code> 内 PNG 母版。</li>
  </ul>

  <h2 id="donts">6. 错误示范</h2>
  <div class="figure">
    <img src="../04-Clearspace-Usage/qingyi-donts.svg" alt="Don'ts"/>
  </div>
  <ul>
    <li class="dont">禁止：拉伸、倾斜、添加投影/发光、改成非规范色。</li>
    <li class="dont">禁止：用光滑几何描边替换扫印方印，或抹平飞白纹理。</li>
    <li class="dont">禁止：在低对比或花哨背景上直接叠放。</li>
    <li class="dont">禁止：拆开方印与字标重新排成未批准的结构（除非使用本手册已列的 Stacked / Seal）。</li>
    <li class="do">允许：在 Paper / White / Ink 深底上的标准色与反白版本。</li>
  </ul>

  <h2 id="apps">7. 应用场景建议</h2>
  <table>
    <tr><th>场景</th><th>推荐版本</th><th>备注</th></tr>
    <tr><td>网站 Header</td><td>Primary 横排</td><td>高度建议 28–36px（按方印高度计）</td></tr>
    <tr><td>Favicon / 聊天球</td><td>Seal</td><td>小尺寸可用 Brush PNG 母版</td></tr>
    <tr><td>名片</td><td>Primary</td><td>印在纸白或 Paper 底</td></tr>
    <tr><td>PPT 封面</td><td>Primary 或 Stacked</td><td>深色封面用 Reverse</td></tr>
    <tr><td>合同 / 页眉</td><td>Mono Ink 或 Primary</td><td>单色印刷用 Mono</td></tr>
    <tr><td>社交媒体头像</td><td>Seal</td><td>留足净空，勿裁切边框</td></tr>
  </table>

  <h2 id="files">8. 交付文件索引</h2>
  <pre style="background:{PAPER};padding:16px;overflow:auto;font-size:0.85rem;">qingyi/
├── 01_Logo_Source/          正式 Logo（SVG，方印为扫印嵌入）
│   └── assets/              毛笔印面 PNG 母版
├── 01-Logo/                 分类副本（Primary / Seal / Stacked / Mono / Reverse）
├── 02_Exports/              导出副本
├── 02-Color/                色板 SVG + colors.json
├── 03_VI_Guidelines/        本规范书（HTML）+ 快速版
├── 04-Clearspace-Usage/     净空图 + 错误示范
├── 04_Templates/            名片 / 信纸 / PPT / 社交模板
├── 05_Brand_Tokens/         JSON / CSS 令牌
├── 05-Applications/         应用示意
├── 06-Brand-Book/           规范书副本
├── 06_Documentation/        说明与声明
└── 07-Export-Ready/         常用导出
  </pre>
  <p class="meta">打印本规范：用 Chrome / Edge 打开本 HTML → 打印 → 另存为 PDF。<br/>
  重建命令：<code>python scripts/rebuild-logo-from-scan.py</code> → <code>python scripts/sync-vi-guidelines.py</code> → <code>python scripts/rebuild-templates-handdrawn.py</code><br/>
  本 VI 为青意传媒原创视觉方案；结构学习了公开品牌手册体例，未复制任何第三方商标图形。</p>
</main>
</body>
</html>
'''


def quick_guide_html() -> str:
    return f'''<!doctype html>
<html lang="zh-CN">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>青意传媒 VI 快速规范</title>
<style>
  :root{{--sage:{SAGE};--ink:{INK};--paper:{PAPER};--mist:{MIST};--pale:#E5E0D8;}}
  *{{box-sizing:border-box}} body{{margin:0;background:var(--paper);color:var(--ink);
  font-family:"Noto Sans SC","Microsoft YaHei",sans-serif;line-height:1.75}}
  header,main,footer{{max-width:1080px;margin:auto;padding:48px}}
  header{{min-height:55vh;display:grid;align-content:center}}
  h1,h2{{font-family:"Noto Serif SC","SimSun",serif;font-weight:650}}
  h1{{font-size:52px;margin:24px 0 0}} h2{{font-size:28px;margin-top:56px}}
  .logo{{width:min(760px,100%);display:block}} .grid{{display:grid;grid-template-columns:repeat(3,1fr);gap:20px}}
  .card{{background:white;padding:24px;border-top:5px solid var(--sage)}} .swatch{{height:120px}}
  code{{background:white;padding:3px 7px}} table{{width:100%;border-collapse:collapse;background:white}}
  th,td{{padding:14px;text-align:left;border-bottom:1px solid var(--pale)}}
  .ratio{{display:flex;height:80px}} .ratio div{{display:grid;place-items:center}}
  @media(max-width:720px){{header,main,footer{{padding:28px}}.grid{{grid-template-columns:1fr}}h1{{font-size:38px}}}}
</style>
</head>
<body>
<header>
  <img class="logo" src="figures/brandbook-primary.png" alt="青意传媒">
  <h1>视觉识别快速规范</h1>
  <p>QINGYI MEDIA VISUAL IDENTITY · VERSION 2.0 · 扫印毛笔方印</p>
</header>
<main>
  <h2>品牌方向</h2>
  <div class="grid">
    <div class="card"><b>有机印面</b><p>毛笔飞白、手作温度，保留概念图扫描纹理。</p></div>
    <div class="card"><b>清晰字标</b><p>宋体字标锐利专业，与印面形成质感对比。</p></div>
    <div class="card"><b>可信赖</b><p>真诚、实际、专业；青绿克制，不过度喧闹。</p></div>
  </div>
  <h2>Logo 使用</h2>
  <table>
    <tr><th>场景</th><th>文件</th><th>最小尺寸</th></tr>
    <tr><td>网站、资料、名片</td><td>Primary_Horizontal.svg</td><td>数字 160px / 印刷 35mm</td></tr>
    <tr><td>头像、App、favicon</td><td>Mark_Jade.svg / Seal Brush PNG</td><td>数字 20px / 印刷 6mm</td></tr>
    <tr><td>深色背景</td><td>Primary_Reversed.svg</td><td>同上</td></tr>
  </table>
  <p>安全留白：<b>X = 方印边长的 1/4</b>。禁止变形、重排、改色、加阴影、抹平飞白或置于低对比背景。</p>
  <h2>色彩</h2>
  <div class="grid">
    <div><div class="swatch" style="background:{SAGE}"></div><b>青绿 Sage {SAGE}</b></div>
    <div><div class="swatch" style="background:{INK}"></div><b>炭黑 Ink {INK}</b></div>
    <div><div class="swatch" style="background:{PAPER};border:1px solid #E5E0D8"></div><b>纸色 Paper {PAPER}</b></div>
  </div>
  <h2>推荐比例</h2>
  <div class="ratio"><div style="width:70%;background:white">70% 纸白</div><div style="width:20%;background:{INK};color:white">20% 炭黑</div><div style="width:10%;background:{SAGE};color:white">10% 青绿</div></div>
  <h2>字体</h2>
  <p><b>标题 / 字标：</b>宋体（Songti SC / STSong / SimSun）<br>
     <b>正文：</b>苹方 / 微软雅黑 / Noto Sans SC</p>
  <h2>品牌语气</h2>
  <p>清楚、真诚、专业、有温度。先说结论，再给行动；不作无法验证的收入或流量承诺；使用行业术语时解释实际价值。</p>
</main>
<footer>© 2026 Qingyi Media · 完整规则见 06-Brand-Book / 03_VI_Guidelines。</footer>
</body>
</html>
'''


def main() -> None:
    primary = (SOURCE / "QingyiMedia_Logo_Primary_Horizontal.svg").read_text(encoding="utf-8")
    seal = (SOURCE / "QingyiMedia_Mark_Jade.svg").read_text(encoding="utf-8")
    if "data:image/png;base64," not in primary:
        raise SystemExit("Primary logo is not the scanned brush version. Run rebuild-logo-from-scan.py first.")

    # Color
    write(DESKTOP / "02-Color" / "qingyi-color-palette.svg", build_color_palette())
    colors = {
        "brand": "青意传媒 Qingyi Media",
        "version": "2.0",
        "primary": {
            "sage": {"hex": SAGE, "rgb": [104, 144, 120]},
            "sageDeep": {"hex": SAGE_DEEP, "rgb": [79, 115, 94]},
            "sageSoft": {"hex": SAGE_SOFT, "rgb": [138, 169, 150]},
        },
        "neutral": {
            "ink": {"hex": INK, "rgb": [40, 40, 40]},
            "inkSoft": {"hex": INK_SOFT, "rgb": [90, 90, 90]},
            "mist": {"hex": MIST, "rgb": [122, 122, 122]},
            "paper": {"hex": PAPER, "rgb": [244, 242, 238]},
            "white": {"hex": WHITE, "rgb": [255, 255, 255]},
            "black": {"hex": BLACK, "rgb": [10, 10, 10]},
        },
    }
    (DESKTOP / "02-Color" / "colors.json").write_text(
        json.dumps(colors, ensure_ascii=False, indent=2) + "\n", encoding="utf-8"
    )
    print("wrote 02-Color/colors.json")

    # Clearspace + donts
    write(DESKTOP / "04-Clearspace-Usage" / "qingyi-clearspace.svg", build_clearspace(primary))
    write(DESKTOP / "04-Clearspace-Usage" / "qingyi-donts.svg", build_donts(primary, seal))

    # Brand books (both copies)
    book = brand_book_html()
    write(DESKTOP / "06-Brand-Book" / "Qingyi-VI-Guidelines.html", book)
    write(DESKTOP / "03_VI_Guidelines" / "Qingyi-VI-Guidelines-Browser.html", book)
    write(DESKTOP / "03_VI_Guidelines" / "QingyiMedia_VI_QuickGuide.html", quick_guide_html())

    # Brand tokens
    tokens_json = {
        "brand": "qingyi-media",
        "version": "2.0",
        "color": {
            "sage": SAGE,
            "sageDeep": SAGE_DEEP,
            "sageSoft": SAGE_SOFT,
            "ink": INK,
            "inkSoft": INK_SOFT,
            "mist": MIST,
            "paper": PAPER,
            "white": WHITE,
            "black": BLACK,
        },
        "logo": {
            "primary": "01_Logo_Source/QingyiMedia_Logo_Primary_Horizontal.svg",
            "seal": "01_Logo_Source/QingyiMedia_Mark_Jade.svg",
            "sealBrushPng": "01_Logo_Source/assets/QingyiMedia_Seal_Brush_Sage.png",
        },
    }
    write(
        DESKTOP / "05_Brand_Tokens" / "qingyi-brand-tokens.json",
        json.dumps(tokens_json, ensure_ascii=False, indent=2) + "\n",
    )
    write(
        DESKTOP / "05_Brand_Tokens" / "qingyi-brand-tokens.css",
        f""":root {{
  --qy-sage: {SAGE};
  --qy-sage-deep: {SAGE_DEEP};
  --qy-sage-soft: {SAGE_SOFT};
  --qy-ink: {INK};
  --qy-ink-soft: {INK_SOFT};
  --qy-mist: {MIST};
  --qy-paper: {PAPER};
  --qy-white: {WHITE};
  --qy-black: {BLACK};
}}
""",
    )

    # Sync exports folder with current SVGs + seal PNG
    EXPORTS.mkdir(parents=True, exist_ok=True)
    for name in [
        "QingyiMedia_Logo_Primary_Horizontal.svg",
        "QingyiMedia_Logo_Primary_OnPaper.svg",
        "QingyiMedia_Logo_Primary_Reversed.svg",
        "QingyiMedia_Logo_Monochrome_Black.svg",
        "QingyiMedia_Logo_Stacked.svg",
        "QingyiMedia_Mark_Jade.svg",
        "QingyiMedia_Mark_Black.svg",
        "QingyiMedia_Mark_White.svg",
    ]:
        src = SOURCE / name
        if src.exists():
            shutil.copy2(src, EXPORTS / name)
            print("copied 02_Exports/", name)
    seal_png = SOURCE / "assets" / "QingyiMedia_Seal_Brush_Sage.png"
    if seal_png.exists():
        shutil.copy2(seal_png, EXPORTS / "QingyiMedia_Seal_Brush_Sage.png")
        shutil.copy2(seal_png, EXPORT_READY / "seal-brush-sage.png")

    # README sync (CN)
    readme = f"""# 青意传媒视觉识别系统（VI）交付包

版本：2.0（概念图扫印毛笔方印 + 矢量宋体字标）  
方案：③ 扫印方印「青」+ 炭黑字标「青意传媒 / QINGYI MEDIA」  
位置：`C:\\Users\\wu200\\Desktop\\qingyi`

> v2.0：方印自批准概念图扫描提取，保留飞白毛笔纹理；字标保持矢量。主标识 / 方印 / 竖式 / 单色 / 反白 / 模板 / **规范书** 已全部同步。

## 快速选择

| 场景 | 文件 |
|------|------|
| 可打印 HTML 规范书 | `06-Brand-Book\\Qingyi-VI-Guidelines.html` |
| 浏览器规范书副本 | `03_VI_Guidelines\\Qingyi-VI-Guidelines-Browser.html` |
| 快速规范 | `03_VI_Guidelines\\QingyiMedia_VI_QuickGuide.html` |
| 网站页头 / 名片 / 资料 | `01_Logo_Source\\QingyiMedia_Logo_Primary_Horizontal.svg` |
| 深色背景 | `01_Logo_Source\\QingyiMedia_Logo_Primary_Reversed.svg` |
| 头像 / App / favicon | `01_Logo_Source\\QingyiMedia_Mark_Jade.svg` |
| 毛笔印面 PNG 母版 | `01_Logo_Source\\assets\\QingyiMedia_Seal_Brush_Sage.png` |
| 单色工艺 | `01_Logo_Source\\QingyiMedia_Logo_Monochrome_Black.svg` |
| 导出副本 | `02_Exports\\` |
| 名片、信纸、PPT、社交模板 | `04_Templates\\` |

## 核心规则

- 安全留白 **X = 方印边长的 1/4**
- 横式标志最小数字宽度约 **160px**；方印最小约 **20px**
- 主色：青绿 Sage `{SAGE}` · 字标 Ink `{INK}` · 纸色 Paper `{PAPER}`
- 禁止：拉伸、旋转、重排、改色、加阴影/渐变、抹平飞白、重新打字标

## 重建

```bash
python scripts/rebuild-logo-from-scan.py
python scripts/sync-vi-guidelines.py
python scripts/rebuild-templates-handdrawn.py
```

## 打印规范书

用 Chrome / Edge 打开 `06-Brand-Book\\Qingyi-VI-Guidelines.html` → 打印 → 另存为 PDF。

## 声明

图形与组合为青意传媒原创。手册结构学习了公开品牌指南常见体例，**未照抄**第三方商标。详见 `06_Documentation\\ORIGINALITY_AND_REFERENCES.md`。
"""
    write(DESKTOP / "README_CN.md", readme)
    write(DESKTOP / "README.md", readme)

    # Quick usage note
    write(
        DESKTOP / "06_Documentation" / "LOGO_USAGE_QUICK_REFERENCE.md",
        f"""# Logo 使用速查 · v2.0

## 主色
- Sage（印面）：`{SAGE}`
- Ink（字标）：`{INK}`
- Paper：`{PAPER}`

## 选用
| 场景 | 文件 |
|------|------|
| 默认横排 | `QingyiMedia_Logo_Primary_Horizontal.svg` |
| 方印 | `QingyiMedia_Mark_Jade.svg` 或 `assets/QingyiMedia_Seal_Brush_Sage.png` |
| 反白 | `QingyiMedia_Logo_Primary_Reversed.svg` |
| 单色 | `QingyiMedia_Logo_Monochrome_Black.svg` |
| 竖式 | `QingyiMedia_Logo_Stacked.svg` |

## 规则
- 净空 X = 方印边长 1/4
- 勿拉伸 / 改色 / 加阴影 / 抹平飞白
- 规范书：`06-Brand-Book/Qingyi-VI-Guidelines.html`
""",
    )

    print("DONE VI guidelines synced to scanned brush logo v2.0")


if __name__ == "__main__":
    main()
