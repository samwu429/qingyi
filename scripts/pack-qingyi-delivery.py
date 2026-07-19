# -*- coding: utf-8 -*-
"""
Pack Desktop/qingyi into a minimal delivery:
  SVG/  — all logo SVGs
  PDF/  — one consolidated VI guidelines PDF
Deletes READMEs and the old multi-folder layout.
"""

from __future__ import annotations

import base64
import shutil
import subprocess
import tempfile
from pathlib import Path

DESKTOP_QINGYI = Path.home() / "Desktop" / "qingyi"
SRC_LOGOS = DESKTOP_QINGYI / "01_Logo_Source"
FIG_DIR = DESKTOP_QINGYI / "03_VI_Guidelines" / "figures"
CLEAR = DESKTOP_QINGYI / "04-Clearspace-Usage"
COLOR = DESKTOP_QINGYI / "02-Color"

SAGE = "#689078"
INK = "#282828"
PAPER = "#F4F2EE"
MIST = "#7A7A7A"
BLACK = "#0A0A0A"

LOGO_SVGS = [
    "QingyiMedia_Logo_Primary_Horizontal.svg",
    "QingyiMedia_Logo_Primary_OnPaper.svg",
    "QingyiMedia_Logo_Primary_Reversed.svg",
    "QingyiMedia_Logo_Monochrome_Black.svg",
    "QingyiMedia_Logo_Ghost_OnBlack.svg",
    "QingyiMedia_Logo_Stacked.svg",
    "QingyiMedia_Mark_Jade.svg",
    "QingyiMedia_Mark_Black.svg",
    "QingyiMedia_Mark_White.svg",
    "QingyiMedia_Wordmark.svg",
    "QingyiMedia_Favicon.svg",
]


def b64_png(path: Path) -> str:
    return base64.b64encode(path.read_bytes()).decode("ascii")


def img_tag(path: Path, width: int | None = None, alt: str = "") -> str:
    if not path.exists():
        return f"<p style='color:#B4534B'>missing: {path.name}</p>"
    w = f' width="{width}"' if width else ""
    return (
        f'<img src="data:image/png;base64,{b64_png(path)}" alt="{alt}"{w} '
        f'style="max-width:100%;height:auto"/>'
    )


def find_edge() -> Path:
    candidates = [
        Path(r"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe"),
        Path(r"C:\Program Files\Microsoft\Edge\Application\msedge.exe"),
    ]
    for c in candidates:
        if c.exists():
            return c
    raise FileNotFoundError("msedge.exe not found")


def screenshot_svg(edge: Path, svg: Path, out: Path, w: int, h: int, bg: str = PAPER) -> None:
    html = f"""<!DOCTYPE html><html><body style="margin:0;background:{bg};
display:flex;align-items:center;justify-content:center;height:100vh">
<img src="file:///{svg.as_posix()}" style="max-width:92%;max-height:92%"/>
</body></html>"""
    tmp = Path(tempfile.gettempdir()) / f"qy-shot-{out.stem}.html"
    tmp.write_text(html, encoding="utf-8")
    out.parent.mkdir(parents=True, exist_ok=True)
    subprocess.run(
        [
            str(edge),
            "--headless",
            "--disable-gpu",
            f"--window-size={w},{h}",
            f"--screenshot={out}",
            tmp.as_uri(),
        ],
        check=False,
        capture_output=True,
    )


def build_html(fig: dict[str, Path]) -> str:
    return f"""<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8"/>
<title>青意传媒 · 视觉识别规范书</title>
<style>
  @page {{ size: A4; margin: 18mm 16mm; }}
  :root {{ --sage:{SAGE}; --ink:{INK}; --paper:{PAPER}; --mist:{MIST}; }}
  * {{ box-sizing: border-box; }}
  body {{
    margin: 0; color: var(--ink); background: white;
    font-family: "PingFang SC", "Microsoft YaHei", sans-serif;
    line-height: 1.65; font-size: 11pt;
  }}
  h1, h2, h3 {{ font-family: "Songti SC", "STSong", "SimSun", serif; font-weight: 700; }}
  h1 {{ font-size: 28pt; letter-spacing: 0.06em; margin: 0 0 0.4em; }}
  h2 {{
    font-size: 16pt; margin: 1.6em 0 0.7em;
    padding-bottom: 0.25em; border-bottom: 2px solid var(--sage);
    break-after: avoid;
  }}
  h3 {{ font-size: 12pt; color: #4F735E; margin: 1.1em 0 0.45em; break-after: avoid; }}
  .cover {{
    min-height: 90vh; display: flex; flex-direction: column; justify-content: center;
    page-break-after: always;
  }}
  .eyebrow {{ letter-spacing: 0.22em; text-transform: uppercase; color: var(--mist); font-size: 9pt; }}
  .lede {{ color: var(--mist); max-width: 38em; }}
  .meta {{ color: var(--mist); font-size: 9.5pt; margin-top: 1.2em; }}
  .figure {{
    margin: 0.8em 0 1.1em; padding: 18px; text-align: center;
    background: var(--paper); border: 1px solid #E5E0D8;
    break-inside: avoid;
  }}
  .figure.dark {{ background: {BLACK}; border-color: {BLACK}; }}
  .grid-2 {{ display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }}
  .swatch {{
    display: flex; gap: 12px; align-items: center;
    padding: 10px; border: 1px solid #E5E0D8; margin: 0.4em 0;
    break-inside: avoid;
  }}
  .chip {{ width: 48px; height: 48px; flex-shrink: 0; }}
  table {{ width: 100%; border-collapse: collapse; font-size: 10pt; }}
  th, td {{ border-bottom: 1px solid #E5E0D8; padding: 8px 6px; text-align: left; vertical-align: top; }}
  th {{ color: var(--mist); font-size: 9pt; }}
  ul {{ padding-left: 1.2em; }}
  li {{ margin: 0.25em 0; }}
  .dont {{ color: #B4534B; }}
  .do {{ color: #4F735E; }}
  code {{ font-family: Consolas, monospace; font-size: 9pt; }}
  .section {{ page-break-inside: avoid; }}
</style>
</head>
<body>

<section class="cover">
  <p class="eyebrow">Visual Identity Guidelines · 2026</p>
  <h1>青意传媒</h1>
  <p class="lede">视觉识别规范书（完整版）— 毛笔感方印 + 宋体字标。方印自概念图扫描保留飞白；字标矢量转曲。</p>
  {img_tag(fig["primary"], 480, "Primary logo")}
  <p class="meta">
    青意传媒（青意贸易（福建福清市）有限公司）<br/>
    创意内容产业 · 主播孵化 · 平台分发与变现<br/>
    版本 v2.0 · 交付结构：SVG/（标志源文件）+ PDF/（本规范书）
  </p>
</section>

<h2>1. 品牌概述</h2>
<p>青意传媒面向直播与短视频创意内容。视觉需同时传达文化根基与当代媒介专业度：毛笔方印「青」作识别锚点，宋体字标提供编辑气质，英文大写字距展开形成国际化阅读层。</p>
<ul>
  <li><strong>有机印面</strong>：保留飞白与墨色不均，勿换成光滑几何描边。</li>
  <li><strong>清晰字标</strong>：中英文案保持矢量锐利，与印面形成质感对比。</li>
  <li><strong>可独立使用</strong>：方印可单独作头像 / App / favicon。</li>
  <li><strong>主色唯一</strong>：印面 Sage <code>{SAGE}</code>，字标 Ink <code>{INK}</code>。</li>
</ul>

<h2>2. Logo 系统</h2>
<h3>2.1 主标识（横排）</h3>
<p>左方印「青」+ 右「青意传媒 / QINGYI MEDIA」。用于网站页头、名片、PPT、合同页眉。</p>
<div class="figure">{img_tag(fig["primary"], 520, "Primary")}<p class="meta">SVG：QingyiMedia_Logo_Primary_Horizontal.svg</p></div>

<h3>2.2 方印（独立）</h3>
<p>头像、favicon、聊天入口、水印。</p>
<div class="figure">{img_tag(fig["seal"], 180, "Seal")}<p class="meta">SVG：QingyiMedia_Mark_Jade.svg</p></div>

<h3>2.3 竖式</h3>
<p>方版海报、启动页、正方形版心。</p>
<div class="figure">{img_tag(fig["stacked"], 200, "Stacked")}<p class="meta">SVG：QingyiMedia_Logo_Stacked.svg</p></div>

<h3>2.4 单色 / 反白</h3>
<div class="grid-2">
  <div class="figure">{img_tag(fig["mono"], 260, "Mono")}<p>单色墨黑<br/><span class="meta">QingyiMedia_Logo_Monochrome_Black.svg</span></p></div>
  <div class="figure dark">{img_tag(fig["reverse"], 260, "Reverse")}<p style="color:{PAPER}">反白深底<br/><span style="opacity:.75">QingyiMedia_Logo_Primary_Reversed.svg</span></p></div>
</div>

<h2>3. 色彩系统</h2>
<div class="figure">{img_tag(fig["palette"], 560, "Palette")}</div>
<div class="swatch"><div class="chip" style="background:{SAGE}"></div><div><strong>Qingyi Sage</strong><br/><code>{SAGE} · RGB 104,144,120 · 印面</code></div></div>
<div class="swatch"><div class="chip" style="background:{INK}"></div><div><strong>Ink</strong><br/><code>{INK} · 字标 / 正文</code></div></div>
<div class="swatch"><div class="chip" style="background:{PAPER};border:1px solid #ddd"></div><div><strong>Paper</strong><br/><code>{PAPER} · 页面底</code></div></div>
<p>勿将方印改为朱红印泥色。本品牌是当代青绿毛笔印。</p>

<h2>4. 字体系统</h2>
<table>
  <tr><th>层级</th><th>中文</th><th>英文</th><th>用途</th></tr>
  <tr><td>品牌 / 标题</td><td>宋体 Songti / STSong / SimSun</td><td>Georgia / Source Serif</td><td>字标、封面</td></tr>
  <tr><td>正文</td><td>苹方 / 微软雅黑</td><td>system-ui</td><td>网站、文档</td></tr>
</table>
<p>Logo 字标已转曲；方印为扫印纹理嵌入 SVG，不依赖终端字体。</p>

<h2>5. 净空与最小尺寸</h2>
<div class="figure">{img_tag(fig["clearspace"], 560, "Clearspace")}</div>
<ul>
  <li><strong>净空 X</strong> = 方印边长的 1/4</li>
  <li>数字：横排 ≥ 120px；方印 ≥ 24px</li>
  <li>印刷：横排 ≥ 28mm；方印 ≥ 8mm</li>
</ul>

<h2>6. 错误示范</h2>
<div class="figure">{img_tag(fig["donts"], 560, "Don'ts")}</div>
<ul>
  <li class="dont">禁止拉伸、倾斜、投影/发光、非规范改色</li>
  <li class="dont">禁止用光滑几何描边替换扫印方印或抹平飞白</li>
  <li class="dont">禁止低对比或花哨背景直接叠放</li>
  <li class="dont">禁止擅自重排方印与字标（除本规范已列竖式 / 独立方印）</li>
  <li class="do">允许 Paper / 白底标准色，以及深底反白</li>
</ul>

<h2>7. 应用场景</h2>
<table>
  <tr><th>场景</th><th>推荐</th><th>文件</th></tr>
  <tr><td>网站 Header</td><td>横排主标识</td><td>QingyiMedia_Logo_Primary_Horizontal.svg</td></tr>
  <tr><td>Favicon / 头像</td><td>方印</td><td>QingyiMedia_Mark_Jade.svg / Favicon.svg</td></tr>
  <tr><td>深色封面</td><td>反白</td><td>QingyiMedia_Logo_Primary_Reversed.svg</td></tr>
  <tr><td>单色印刷</td><td>墨黑</td><td>QingyiMedia_Logo_Monochrome_Black.svg</td></tr>
  <tr><td>方版海报</td><td>竖式</td><td>QingyiMedia_Logo_Stacked.svg</td></tr>
</table>

<h2>8. 交付文件</h2>
<p>本包仅两个文件夹：</p>
<pre style="background:{PAPER};padding:14px;font-size:10pt;">qingyi/
├── SVG/     全部标志 SVG（直接使用）
└── PDF/     青意传媒_视觉识别规范书.pdf（本文件）
</pre>
<p class="meta">© 2026 青意传媒 · 原创视觉方案</p>

</body>
</html>
"""


def main() -> None:
    if not SRC_LOGOS.exists():
        raise SystemExit(f"Missing logo source: {SRC_LOGOS}")

    edge = find_edge()
    work = Path(tempfile.mkdtemp(prefix="qingyi-pack-"))
    fig_work = work / "figures"
    fig_work.mkdir()

    # Ensure brand figures exist; regenerate supporting diagrams as PNG.
    needed = {
        "primary": FIG_DIR / "brandbook-primary.png",
        "seal": FIG_DIR / "brandbook-seal.png",
        "stacked": FIG_DIR / "brandbook-stacked.png",
        "mono": FIG_DIR / "brandbook-mono.png",
        "reverse": FIG_DIR / "brandbook-reverse.png",
    }
    for key, path in needed.items():
        dest = fig_work / path.name
        if path.exists():
            shutil.copy2(path, dest)
        else:
            raise SystemExit(f"Missing figure: {path}")

    screenshot_svg(edge, COLOR / "qingyi-color-palette.svg", fig_work / "palette.png", 900, 700)
    screenshot_svg(edge, CLEAR / "qingyi-clearspace.svg", fig_work / "clearspace.png", 1000, 560)
    screenshot_svg(edge, CLEAR / "qingyi-donts.svg", fig_work / "donts.png", 1100, 900)

    figs = {
        "primary": fig_work / "brandbook-primary.png",
        "seal": fig_work / "brandbook-seal.png",
        "stacked": fig_work / "brandbook-stacked.png",
        "mono": fig_work / "brandbook-mono.png",
        "reverse": fig_work / "brandbook-reverse.png",
        "palette": fig_work / "palette.png",
        "clearspace": fig_work / "clearspace.png",
        "donts": fig_work / "donts.png",
    }

    html_path = work / "guidelines.html"
    html_path.write_text(build_html(figs), encoding="utf-8")

    pdf_tmp = work / "QingyiMedia_VI_Guidelines.pdf"
    subprocess.run(
        [
            str(edge),
            "--headless",
            "--disable-gpu",
            f"--print-to-pdf={pdf_tmp}",
            "--no-pdf-header-footer",
            html_path.as_uri(),
        ],
        check=False,
        capture_output=True,
    )
    if not pdf_tmp.exists() or pdf_tmp.stat().st_size < 10_000:
        raise SystemExit("PDF generation failed")

    # Build clean delivery in a sibling folder, then replace Desktop/qingyi
    staging = Path.home() / "Desktop" / "qingyi_delivery_staging"
    if staging.exists():
        shutil.rmtree(staging)
    svg_dir = staging / "SVG"
    pdf_dir = staging / "PDF"
    svg_dir.mkdir(parents=True)
    pdf_dir.mkdir(parents=True)

    for name in LOGO_SVGS:
        src = SRC_LOGOS / name
        if src.exists():
            shutil.copy2(src, svg_dir / name)
            print("svg", name)
        else:
            print("skip missing", name)

    shutil.copy2(pdf_tmp, pdf_dir / "QingyiMedia_VI_Guidelines.pdf")
    print("pdf", pdf_dir / "QingyiMedia_VI_Guidelines.pdf")

    # Replace old tree
    backup = Path.home() / "Desktop" / "qingyi_old_backup_delete_me"
    if backup.exists():
        shutil.rmtree(backup)
    if DESKTOP_QINGYI.exists():
        DESKTOP_QINGYI.rename(backup)
    staging.rename(DESKTOP_QINGYI)
    shutil.rmtree(backup)
    shutil.rmtree(work, ignore_errors=True)

    print("DONE")
    print("  ", DESKTOP_QINGYI / "SVG")
    print("  ", DESKTOP_QINGYI / "PDF")
    for p in sorted((DESKTOP_QINGYI / "SVG").iterdir()):
        print("   -", p.name)
    for p in sorted((DESKTOP_QINGYI / "PDF").iterdir()):
        print("   -", p.name, f"({p.stat().st_size // 1024} KB)")


if __name__ == "__main__":
    main()
