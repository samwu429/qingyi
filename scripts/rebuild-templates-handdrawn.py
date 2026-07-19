# -*- coding: utf-8 -*-
"""Rebuild application templates to embed the hand-drawn seal logos."""

from __future__ import annotations

import re
from pathlib import Path

DESKTOP = Path.home() / "Desktop" / "qingyi"
SOURCE = DESKTOP / "01_Logo_Source"
TEMPLATES = DESKTOP / "04_Templates"

SAGE = "#689078"
INK = "#282828"
PAPER = "#F4F2EE"
WHITE = "#FFFFFF"
BLACK = "#0A0A0A"


def extract_inner(svg_text: str) -> tuple[str, float, float]:
    """Return (inner markup without outer svg), viewBox w, h."""
    m = re.search(r'viewBox="0 0 ([0-9.]+) ([0-9.]+)"', svg_text)
    if not m:
        raise ValueError("no viewBox")
    w, h = float(m.group(1)), float(m.group(2))
    # Strip xml decl and outer svg tags.
    body = re.sub(r"<\?xml[^>]*>", "", svg_text)
    body = re.sub(r"<svg[^>]*>", "", body, count=1)
    body = re.sub(r"</svg>\s*$", "", body)
    # Drop title/desc/metadata for embedding cleanliness.
    body = re.sub(r"<title>.*?</title>", "", body, flags=re.S)
    body = re.sub(r"<desc>.*?</desc>", "", body, flags=re.S)
    body = re.sub(r"<metadata>.*?</metadata>", "", body, flags=re.S)
    return body.strip(), w, h


def wrap_logo(inner: str, src_w: float, src_h: float, x: float, y: float, target_h: float) -> str:
    scale = target_h / src_h
    return (
        f'<g transform="translate({x},{y}) scale({scale:.5f})">'
        f"{inner}</g>"
    )


def main() -> None:
    primary = (SOURCE / "QingyiMedia_Logo_Primary_Horizontal.svg").read_text(encoding="utf-8")
    mark = (SOURCE / "QingyiMedia_Mark_Jade.svg").read_text(encoding="utf-8")
    reverse = (SOURCE / "QingyiMedia_Logo_Primary_Reversed.svg").read_text(encoding="utf-8")
    ghost = (SOURCE / "QingyiMedia_Logo_Ghost_OnBlack.svg").read_text(encoding="utf-8")

    p_inner, pw, ph = extract_inner(primary)
    m_inner, mw, mh = extract_inner(mark)
    r_inner, rw, rh = extract_inner(reverse)
    g_inner, gw, gh = extract_inner(ghost)

    # --- Business card front (dark jade bar + white reverse logo) ---
    # Use ghost/white logo on sage background for brand feel.
    white_on_sage = reverse  # white logo on black viewBox — we'll place only the logo group on sage
    # Better: use mark white + wordmark white built from reverse transparent style.
    # Primary reversed has black bg rect — strip rect fills that are full bg.
    r_body = re.sub(
        r'<rect[^>]*width="100%"[^>]*/>',
        "",
        r_inner,
    )
    r_body = re.sub(r'<rect[^>]*fill="#0A0A0A"[^>]*/>', "", r_body)

    front = f'''<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="1050" height="600" viewBox="0 0 1050 600">
  <rect width="1050" height="600" fill="{SAGE}"/>
  {wrap_logo(r_body, rw, rh, 72, 210, 120)}
  <text x="72" y="420" font-family="Microsoft YaHei, sans-serif" font-size="18" fill="{WHITE}" fill-opacity=".85">创意内容产业 · 主播孵化 · 平台分发与变现</text>
</svg>
'''
    (TEMPLATES / "BusinessCard_Front.svg").write_text(front, encoding="utf-8")

    back = f'''<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="1050" height="600" viewBox="0 0 1050 600">
  <rect width="1050" height="600" fill="{PAPER}"/>
  {wrap_logo(p_inner, pw, ph, 70, 80, 90)}
  <rect x="70" y="220" width="64" height="3" fill="{SAGE}"/>
  <text x="70" y="280" font-family="Microsoft YaHei, sans-serif" font-size="22" fill="{INK}">姓名 Name</text>
  <text x="70" y="318" font-family="Microsoft YaHei, sans-serif" font-size="16" fill="#5F746D">职位 Title</text>
  <text x="70" y="400" font-family="Microsoft YaHei, sans-serif" font-size="15" fill="#5F746D">contact@qingyimedia.cn</text>
  <text x="70" y="432" font-family="Microsoft YaHei, sans-serif" font-size="15" fill="#5F746D">福建省福清市</text>
</svg>
'''
    (TEMPLATES / "BusinessCard_Back.svg").write_text(back, encoding="utf-8")

    letter = f'''<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="794" height="1123" viewBox="0 0 794 1123">
  <rect width="794" height="1123" fill="{WHITE}"/>
  {wrap_logo(p_inner, pw, ph, 56, 48, 56)}
  <line x1="56" y1="130" x2="738" y2="130" stroke="{SAGE}" stroke-width="1.5"/>
  <text x="56" y="200" font-family="Microsoft YaHei, sans-serif" font-size="14" fill="#5F746D">信纸正文区域 · Letter body</text>
  <text x="56" y="1060" font-family="Microsoft YaHei, sans-serif" font-size="12" fill="#5F746D">青意传媒 · Qingyi Media</text>
</svg>
'''
    (TEMPLATES / "Letterhead_A4.svg").write_text(letter, encoding="utf-8")

    ppt = f'''<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="1920" height="1080" viewBox="0 0 1920 1080">
  <rect width="1920" height="1080" fill="{PAPER}"/>
  <rect x="0" y="0" width="28" height="1080" fill="{SAGE}"/>
  {wrap_logo(p_inner, pw, ph, 120, 420, 110)}
  <text x="120" y="620" font-family="Songti SC, STSong, SimSun, serif" font-size="42" fill="{INK}">把个人创意做成可持续的内容事业</text>
  <text x="120" y="680" font-family="Microsoft YaHei, sans-serif" font-size="20" fill="#5F746D">Qingyi Media · Presentation Cover</text>
</svg>
'''
    (TEMPLATES / "Presentation_Cover_16x9.svg").write_text(ppt, encoding="utf-8")

    social = f'''<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="1080" height="1080" viewBox="0 0 1080 1080">
  <rect width="1080" height="1080" fill="{PAPER}"/>
  {wrap_logo(m_inner, mw, mh, 390, 280, 300)}
  <text x="540" y="680" text-anchor="middle" font-family="Songti SC, STSong, SimSun, serif" font-size="48" fill="{INK}">青意传媒</text>
  <text x="540" y="740" text-anchor="middle" font-family="Georgia, serif" font-size="18" letter-spacing="6" fill="#5F746D">QINGYI MEDIA</text>
</svg>
'''
    (TEMPLATES / "Social_Post_1080x1080.svg").write_text(social, encoding="utf-8")

    email = f'''<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="640" height="160" viewBox="0 0 640 160">
  <rect width="640" height="160" fill="{WHITE}"/>
  {wrap_logo(p_inner, pw, ph, 16, 40, 48)}
  <line x1="300" y1="30" x2="300" y2="130" stroke="#DCE7E2" stroke-width="1"/>
  <text x="320" y="60" font-family="Microsoft YaHei, sans-serif" font-size="16" fill="{INK}">姓名 · 职位</text>
  <text x="320" y="90" font-family="Microsoft YaHei, sans-serif" font-size="13" fill="#5F746D">contact@qingyimedia.cn</text>
  <text x="320" y="118" font-family="Microsoft YaHei, sans-serif" font-size="13" fill="#5F746D">qingyi.onrender.com</text>
</svg>
'''
    (TEMPLATES / "Email_Signature.svg").write_text(email, encoding="utf-8")

    # Dark cover variant using ghost logo
    g_body = re.sub(r'<rect[^>]*width="100%"[^>]*/>', "", g_inner)
    g_body = re.sub(r'<rect[^>]*fill="#0A0A0A"[^>]*/>', "", g_body)
    dark_ppt = f'''<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="1920" height="1080" viewBox="0 0 1920 1080">
  <rect width="1920" height="1080" fill="{BLACK}"/>
  {wrap_logo(g_body, gw, gh, 120, 430, 110)}
  <text x="120" y="640" font-family="Microsoft YaHei, sans-serif" font-size="20" fill="#5F746D">Dark Cover · Hand-drawn Seal</text>
</svg>
'''
    (TEMPLATES / "Presentation_Cover_Dark_16x9.svg").write_text(dark_ppt, encoding="utf-8")

    print("templates rebuilt with hand-drawn seal")


if __name__ == "__main__":
    main()
