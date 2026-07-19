from __future__ import annotations

import hashlib
import json
import math
import shutil
import textwrap
from dataclasses import dataclass
from datetime import date
from pathlib import Path

import resvg_py
from PIL import Image, ImageDraw
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.ttLib import TTFont
from fontTools.varLib.instancer import instantiateVariableFont
from reportlab.lib.colors import Color, HexColor, white
from reportlab.lib.pagesizes import A4, landscape
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont as RLTTFont
from reportlab.pdfgen import canvas
from reportlab.graphics import renderPDF
from svglib.svglib import svg2rlg


ROOT = Path(r"C:\Users\wu200\Desktop\qingyi")
LOGO_DIR = ROOT / "01_Logo_Source"
EXPORT_DIR = ROOT / "02_Exports"
GUIDE_DIR = ROOT / "03_VI_Guidelines"
TEMPLATE_DIR = ROOT / "04_Templates"
TOKENS_DIR = ROOT / "05_Brand_Tokens"
DOCS_DIR = ROOT / "06_Documentation"

FONT_SERIF = Path(r"C:\Windows\Fonts\NotoSerifSC-VF.ttf")
FONT_SANS = Path(r"C:\Windows\Fonts\NotoSansSC-VF.ttf")

JADE = "#0C8A6B"
JADE_DARK = "#075D49"
JADE_LIGHT = "#DDECE7"
INK = "#0F1F1B"
MIST = "#5F746D"
PAPER = "#F3F7F5"
WHITE = "#FFFFFF"
GOLD = "#B8995A"

VERSION = "1.0"
TODAY = date.today().isoformat()


@dataclass
class FontData:
    font: TTFont
    glyph_set: object
    cmap: dict[int, str]
    metrics: dict[str, tuple[int, int]]
    upem: int


_FONT_CACHE: dict[tuple[str, int], FontData] = {}


def font_data(path: Path, weight: int) -> FontData:
    key = (str(path), weight)
    if key in _FONT_CACHE:
        return _FONT_CACHE[key]
    font = TTFont(path)
    if "fvar" in font:
        font = instantiateVariableFont(font, {"wght": weight}, inplace=False)
    data = FontData(
        font=font,
        glyph_set=font.getGlyphSet(),
        cmap=font.getBestCmap(),
        metrics=font["hmtx"].metrics,
        upem=font["head"].unitsPerEm,
    )
    _FONT_CACHE[key] = data
    return data


def text_width(
    text: str,
    path: Path,
    weight: int,
    size: float,
    letter_spacing: float = 0,
) -> float:
    fd = font_data(path, weight)
    scale = size / fd.upem
    width = 0.0
    for index, char in enumerate(text):
        name = fd.cmap.get(ord(char), ".notdef")
        width += fd.metrics.get(name, (fd.upem, 0))[0] * scale
        if index < len(text) - 1:
            width += letter_spacing
    return width


def text_paths(
    text: str,
    path: Path,
    weight: int,
    size: float,
    x: float,
    baseline: float,
    fill: str,
    letter_spacing: float = 0,
    anchor: str = "start",
) -> str:
    fd = font_data(path, weight)
    scale = size / fd.upem
    total = text_width(text, path, weight, size, letter_spacing)
    cursor = x
    if anchor == "middle":
        cursor -= total / 2
    elif anchor == "end":
        cursor -= total
    paths: list[str] = []
    for char in text:
        name = fd.cmap.get(ord(char), ".notdef")
        pen = SVGPathPen(fd.glyph_set)
        fd.glyph_set[name].draw(pen)
        commands = pen.getCommands()
        if commands:
            paths.append(
                f'<path d="{commands}" fill="{fill}" '
                f'transform="translate({cursor:.3f},{baseline:.3f}) '
                f'scale({scale:.7f},{-scale:.7f})"/>'
            )
        cursor += fd.metrics.get(name, (fd.upem, 0))[0] * scale + letter_spacing
    return "\n".join(paths)


def svg_document(width: int, height: int, body: str, title: str) -> str:
    return f'''<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="{width}" height="{height}"
     viewBox="0 0 {width} {height}" role="img" aria-labelledby="title desc">
  <title id="title">{title}</title>
  <desc id="desc">Qingyi Media original visual identity artwork, version {VERSION}</desc>
  <metadata>Copyright Qingyi Media. Created {TODAY}. Logo lettering is converted to vector outlines.</metadata>
  {body}
</svg>
'''


def mark_body(
    x: float,
    y: float,
    size: float,
    mode: str = "jade",
) -> str:
    radius = size * 0.14
    inset = size * 0.065
    if mode == "jade":
        bg = JADE
        glyph = WHITE
        outer = (
            f'<rect x="{x}" y="{y}" width="{size}" height="{size}" '
            f'rx="{radius}" fill="{bg}"/>'
        )
        keyline = (
            f'<rect x="{x + inset}" y="{y + inset}" '
            f'width="{size - inset * 2}" height="{size - inset * 2}" '
            f'rx="{radius * 0.68}" fill="none" stroke="{WHITE}" '
            f'stroke-opacity=".25" stroke-width="{size * 0.012}"/>'
        )
    elif mode == "white":
        glyph = WHITE
        outer = (
            f'<rect x="{x + size * 0.035}" y="{y + size * 0.035}" '
            f'width="{size * 0.93}" height="{size * 0.93}" rx="{radius}" '
            f'fill="none" stroke="{WHITE}" stroke-width="{size * 0.045}"/>'
        )
        keyline = ""
    else:
        glyph = INK
        outer = (
            f'<rect x="{x + size * 0.035}" y="{y + size * 0.035}" '
            f'width="{size * 0.93}" height="{size * 0.93}" rx="{radius}" '
            f'fill="none" stroke="{INK}" stroke-width="{size * 0.045}"/>'
        )
        keyline = ""
    glyph_size = size * 0.69
    glyph_x = x + size / 2
    glyph_baseline = y + size * 0.745
    glyph_path = text_paths(
        "青",
        FONT_SERIF,
        760,
        glyph_size,
        glyph_x,
        glyph_baseline,
        glyph,
        anchor="middle",
    )
    return f"{outer}\n{keyline}\n{glyph_path}"


def primary_body(mode: str = "jade") -> str:
    mark_mode = mode
    text_color = WHITE if mode == "white" else INK
    return "\n".join(
        [
            mark_body(30, 30, 200, mark_mode),
            text_paths(
                "青意传媒",
                FONT_SERIF,
                650,
                92,
                280,
                124,
                text_color,
                letter_spacing=8,
            ),
            text_paths(
                "QINGYI MEDIA",
                FONT_SANS,
                500,
                25,
                283,
                194,
                text_color,
                letter_spacing=15,
            ),
        ]
    )


def write_svg(path: Path, width: int, height: int, body: str, title: str) -> None:
    path.write_text(svg_document(width, height, body, title), encoding="utf-8")


def create_logo_assets() -> dict[str, Path]:
    assets: dict[str, Path] = {}

    assets["primary"] = LOGO_DIR / "QingyiMedia_Logo_Primary_Horizontal.svg"
    write_svg(
        assets["primary"],
        1200,
        260,
        primary_body("jade"),
        "青意传媒主标志横式",
    )

    assets["reversed"] = LOGO_DIR / "QingyiMedia_Logo_Primary_Reversed.svg"
    write_svg(
        assets["reversed"],
        1200,
        260,
        primary_body("white"),
        "青意传媒反白标志横式",
    )

    assets["mono"] = LOGO_DIR / "QingyiMedia_Logo_Monochrome_Black.svg"
    write_svg(
        assets["mono"],
        1200,
        260,
        primary_body("black"),
        "青意传媒单色黑标志",
    )

    stacked = "\n".join(
        [
            mark_body(160, 40, 240, "jade"),
            text_paths(
                "青意传媒",
                FONT_SERIF,
                650,
                64,
                280,
                380,
                INK,
                letter_spacing=6,
                anchor="middle",
            ),
            text_paths(
                "QINGYI MEDIA",
                FONT_SANS,
                500,
                20,
                280,
                438,
                INK,
                letter_spacing=10,
                anchor="middle",
            ),
        ]
    )
    assets["stacked"] = LOGO_DIR / "QingyiMedia_Logo_Stacked.svg"
    write_svg(
        assets["stacked"],
        560,
        500,
        stacked,
        "青意传媒主标志竖式",
    )

    assets["mark"] = LOGO_DIR / "QingyiMedia_Mark_Jade.svg"
    write_svg(
        assets["mark"],
        512,
        512,
        mark_body(51, 51, 410, "jade"),
        "青意传媒青字方印",
    )

    assets["mark_black"] = LOGO_DIR / "QingyiMedia_Mark_Black.svg"
    write_svg(
        assets["mark_black"],
        512,
        512,
        mark_body(51, 51, 410, "black"),
        "青意传媒单色方印",
    )

    assets["mark_white"] = LOGO_DIR / "QingyiMedia_Mark_White.svg"
    write_svg(
        assets["mark_white"],
        512,
        512,
        mark_body(51, 51, 410, "white"),
        "青意传媒反白方印",
    )

    wordmark = "\n".join(
        [
            text_paths(
                "青意传媒",
                FONT_SERIF,
                650,
                100,
                20,
                120,
                INK,
                letter_spacing=10,
            ),
            text_paths(
                "QINGYI MEDIA",
                FONT_SANS,
                500,
                27,
                23,
                192,
                INK,
                letter_spacing=16,
            ),
        ]
    )
    assets["wordmark"] = LOGO_DIR / "QingyiMedia_Wordmark.svg"
    write_svg(
        assets["wordmark"],
        740,
        220,
        wordmark,
        "青意传媒中英文字标",
    )

    favicon = mark_body(8, 8, 48, "jade")
    assets["favicon"] = LOGO_DIR / "QingyiMedia_Favicon.svg"
    write_svg(
        assets["favicon"],
        64,
        64,
        favicon,
        "青意传媒网站图标",
    )

    clearspace = "\n".join(
        [
            '<rect width="1400" height="520" fill="#FFFFFF"/>',
            '<rect x="100" y="100" width="1200" height="260" fill="none" '
            'stroke="#0C8A6B" stroke-dasharray="10 8" stroke-width="2"/>',
            '<g transform="translate(100,100)">',
            primary_body("jade"),
            "</g>",
            '<path d="M30 70V20M30 45H100" stroke="#0C8A6B" stroke-width="2"/>',
            '<path d="M1300 70V20M1230 45H1300" stroke="#0C8A6B" stroke-width="2"/>',
            '<text x="65" y="36" font-family="Arial" font-size="20" fill="#0C8A6B">X</text>',
            '<text x="1260" y="36" font-family="Arial" font-size="20" fill="#0C8A6B">X</text>',
            '<text x="100" y="440" font-family="Noto Sans SC, sans-serif" font-size="24" fill="#5F746D">'
            "安全留白 X = 方印边长的 1/4；任何文字、图形和页面边缘不得进入虚线区域。</text>",
        ]
    )
    assets["clearspace"] = LOGO_DIR / "QingyiMedia_Logo_Clearspace.svg"
    write_svg(
        assets["clearspace"],
        1400,
        520,
        clearspace,
        "青意传媒标志安全留白规范",
    )
    return assets


def render_exports(assets: dict[str, Path]) -> dict[str, Path]:
    outputs: dict[str, Path] = {}

    sizes = [
        ("Primary_1200px", assets["primary"], 1200, None),
        ("Primary_2400px", assets["primary"], 2400, None),
        ("Mark_1024px", assets["mark"], 1024, 1024),
        ("Mark_512px", assets["mark"], 512, 512),
        ("Social_Avatar_800px", assets["mark"], 800, 800),
        ("Favicon_64px", assets["favicon"], 64, 64),
        ("Favicon_32px", assets["favicon"], 32, 32),
    ]
    for name, source, width, height in sizes:
        target = EXPORT_DIR / f"QingyiMedia_{name}.png"
        target.write_bytes(
            resvg_py.svg_to_bytes(
                svg_path=str(source),
                width=width,
                height=height,
                shape_rendering="geometric_precision",
                image_rendering="optimize_quality",
            )
        )
        outputs[name] = target

    pdf_target = EXPORT_DIR / "QingyiMedia_Logo_Primary_Vector.pdf"
    drawing = svg2rlg(str(assets["primary"]))
    renderPDF.drawToFile(drawing, str(pdf_target))
    outputs["primary_pdf"] = pdf_target

    ico_png = Image.open(outputs["Mark_512px"]).convert("RGBA")
    ico_target = EXPORT_DIR / "QingyiMedia_Favicon.ico"
    ico_png.save(ico_target, format="ICO", sizes=[(16, 16), (32, 32), (48, 48), (64, 64), (128, 128), (256, 256)])
    outputs["favicon_ico"] = ico_target

    contact = Image.new("RGB", (1800, 1200), (243, 247, 245))
    draw = ImageDraw.Draw(contact)
    p1 = Image.open(outputs["Primary_1200px"]).convert("RGBA")
    p1.thumbnail((1400, 310))
    contact.paste(p1, ((1800 - p1.width) // 2, 110), p1)
    mark = Image.open(outputs["Mark_512px"]).convert("RGBA")
    mark.thumbnail((360, 360))
    contact.paste(mark, (190, 570), mark)
    reversed_bg = Image.new("RGB", (850, 360), (15, 31, 27))
    contact.paste(reversed_bg, (650, 570))
    reversed_png = EXPORT_DIR / "_temp_reversed.png"
    reversed_png.write_bytes(
        resvg_py.svg_to_bytes(
            svg_path=str(assets["reversed"]),
            width=760,
            shape_rendering="geometric_precision",
        )
    )
    rev = Image.open(reversed_png).convert("RGBA")
    contact.paste(rev, (700, 635), rev)
    reversed_png.unlink(missing_ok=True)
    contact_target = EXPORT_DIR / "QingyiMedia_Logo_Preview_Board.png"
    contact.save(contact_target, quality=95)
    outputs["contact"] = contact_target
    return outputs


def logo_embed(mode: str = "jade") -> str:
    return primary_body(mode)


def create_templates() -> None:
    front = "\n".join(
        [
            f'<rect width="1050" height="600" fill="{JADE}"/>',
            '<g transform="translate(165,222) scale(.6)">',
            primary_body("white"),
            "</g>",
        ]
    )
    write_svg(
        TEMPLATE_DIR / "BusinessCard_Front.svg",
        1050,
        600,
        front,
        "青意传媒名片正面模板",
    )

    back = "\n".join(
        [
            f'<rect width="1050" height="600" fill="{PAPER}"/>',
            '<g transform="translate(70,55) scale(.38)">',
            primary_body("jade"),
            "</g>",
            f'<rect x="70" y="232" width="70" height="4" fill="{JADE}"/>',
            f'<text x="70" y="315" font-family="Noto Serif SC, serif" font-size="38" font-weight="600" fill="{INK}">姓名 / NAME</text>',
            f'<text x="70" y="360" font-family="Noto Sans SC, sans-serif" font-size="22" fill="{MIST}">职务 / TITLE</text>',
            f'<text x="650" y="310" font-family="Noto Sans SC, sans-serif" font-size="20" fill="{INK}">M  +86 000 0000 0000</text>',
            f'<text x="650" y="350" font-family="Noto Sans SC, sans-serif" font-size="20" fill="{INK}">E  contact@qingyimedia.cn</text>',
            f'<text x="650" y="390" font-family="Noto Sans SC, sans-serif" font-size="20" fill="{INK}">W  qingyi.onrender.com</text>',
            f'<text x="650" y="430" font-family="Noto Sans SC, sans-serif" font-size="20" fill="{INK}">A  福建省福清市音西街道</text>',
        ]
    )
    write_svg(
        TEMPLATE_DIR / "BusinessCard_Back.svg",
        1050,
        600,
        back,
        "青意传媒名片背面模板",
    )

    letter = "\n".join(
        [
            f'<rect width="2100" height="2970" fill="{WHITE}"/>',
            '<g transform="translate(130,110) scale(.72)">',
            primary_body("jade"),
            "</g>",
            f'<line x1="130" y1="350" x2="1970" y2="350" stroke="{JADE_LIGHT}" stroke-width="4"/>',
            f'<text x="130" y="560" font-family="Noto Serif SC, serif" font-size="72" font-weight="600" fill="{INK}">文件标题</text>',
            f'<text x="130" y="635" font-family="Noto Sans SC, sans-serif" font-size="30" fill="{MIST}">副标题 / DOCUMENT SUBTITLE</text>',
            f'<text x="130" y="800" font-family="Noto Sans SC, sans-serif" font-size="30" fill="{INK}">正文从此处开始。推荐使用思源黑体 / Noto Sans SC，字号 10.5–11 pt，</text>',
            f'<text x="130" y="850" font-family="Noto Sans SC, sans-serif" font-size="30" fill="{INK}">行距约为字号的 1.6 倍，正文保持左对齐。</text>',
            f'<line x1="130" y1="2740" x2="1970" y2="2740" stroke="{JADE_LIGHT}" stroke-width="4"/>',
            f'<text x="130" y="2820" font-family="Noto Sans SC, sans-serif" font-size="24" fill="{MIST}">青意贸易（福建福清市）有限公司</text>',
            f'<text x="1970" y="2820" text-anchor="end" font-family="Noto Sans SC, sans-serif" font-size="24" fill="{MIST}">QINGYI MEDIA</text>',
        ]
    )
    write_svg(
        TEMPLATE_DIR / "Letterhead_A4.svg",
        2100,
        2970,
        letter,
        "青意传媒A4信纸模板",
    )

    presentation = "\n".join(
        [
            f'<rect width="1920" height="1080" fill="{PAPER}"/>',
            f'<rect x="0" y="0" width="400" height="1080" fill="{JADE}"/>',
            '<g transform="translate(74,76) scale(.22)">',
            primary_body("white"),
            "</g>",
            f'<text x="500" y="400" font-family="Noto Serif SC, serif" font-size="92" font-weight="650" fill="{INK}">演示文稿标题</text>',
            f'<rect x="500" y="455" width="110" height="8" fill="{JADE}"/>',
            f'<text x="500" y="545" font-family="Noto Sans SC, sans-serif" font-size="38" fill="{MIST}">副标题 / PRESENTATION SUBTITLE</text>',
            f'<text x="500" y="880" font-family="Noto Sans SC, sans-serif" font-size="28" fill="{MIST}">部门 · 姓名 · YYYY.MM.DD</text>',
        ]
    )
    write_svg(
        TEMPLATE_DIR / "Presentation_Cover_16x9.svg",
        1920,
        1080,
        presentation,
        "青意传媒演示文稿封面模板",
    )

    social = "\n".join(
        [
            f'<rect width="1080" height="1080" fill="{PAPER}"/>',
            f'<rect x="0" y="0" width="1080" height="110" fill="{JADE}"/>',
            '<g transform="translate(64,30) scale(.23)">',
            primary_body("white"),
            "</g>",
            f'<text x="70" y="420" font-family="Noto Serif SC, serif" font-size="88" font-weight="650" fill="{INK}">内容标题</text>',
            f'<text x="70" y="510" font-family="Noto Sans SC, sans-serif" font-size="40" fill="{MIST}">用一句清晰的话说明主题</text>',
            f'<rect x="70" y="810" width="940" height="160" fill="{JADE_LIGHT}"/>',
            f'<text x="100" y="900" font-family="Noto Sans SC, sans-serif" font-size="36" fill="{JADE_DARK}">关键词 / 活动日期 / 行动指引</text>',
        ]
    )
    write_svg(
        TEMPLATE_DIR / "Social_Post_1080x1080.svg",
        1080,
        1080,
        social,
        "青意传媒社交媒体方图模板",
    )

    signature = "\n".join(
        [
            f'<rect width="1200" height="320" fill="{WHITE}"/>',
            '<g transform="translate(25,45) scale(.38)">',
            primary_body("jade"),
            "</g>",
            f'<line x1="485" y1="45" x2="485" y2="275" stroke="{JADE_LIGHT}" stroke-width="3"/>',
            f'<text x="535" y="100" font-family="Noto Serif SC, serif" font-size="34" font-weight="600" fill="{INK}">姓名 NAME</text>',
            f'<text x="535" y="145" font-family="Noto Sans SC, sans-serif" font-size="20" fill="{MIST}">职务 / TITLE</text>',
            f'<text x="535" y="200" font-family="Noto Sans SC, sans-serif" font-size="19" fill="{INK}">contact@qingyimedia.cn · qingyi.onrender.com</text>',
            f'<text x="535" y="238" font-family="Noto Sans SC, sans-serif" font-size="19" fill="{INK}">福建省福清市音西街道</text>',
        ]
    )
    write_svg(
        TEMPLATE_DIR / "Email_Signature.svg",
        1200,
        320,
        signature,
        "青意传媒电子邮件签名模板",
    )


def render_template_preview() -> Path:
    specs = [
        ("BusinessCard_Front.svg", 650, None, (70, 90)),
        ("BusinessCard_Back.svg", 650, None, (760, 90)),
        ("Presentation_Cover_16x9.svg", 760, None, (70, 560)),
        ("Social_Post_1080x1080.svg", 480, 480, (870, 535)),
        ("Letterhead_A4.svg", 330, None, (1370, 90)),
        ("Email_Signature.svg", 760, None, (70, 1110)),
    ]
    board = Image.new("RGB", (1800, 1400), (232, 238, 235))
    for index, (name, width, height, position) in enumerate(specs):
        source = TEMPLATE_DIR / name
        png = EXPORT_DIR / f"_template_{index}.png"
        png.write_bytes(
            resvg_py.svg_to_bytes(
                svg_path=str(source),
                width=width,
                height=height,
                font_files=[str(FONT_SERIF), str(FONT_SANS)],
                shape_rendering="geometric_precision",
                text_rendering="optimize_legibility",
            )
        )
        image = Image.open(png).convert("RGBA")
        board.paste(image, position, image)
        png.unlink(missing_ok=True)
    target = EXPORT_DIR / "QingyiMedia_Template_Preview_Board.png"
    board.save(target, quality=95)
    return target


def create_tokens() -> None:
    data = {
        "brand": "Qingyi Media",
        "version": VERSION,
        "colors": {
            "qingJade": {
                "hex": JADE,
                "rgb": [12, 138, 107],
                "cmyk": [91, 0, 22, 46],
                "usage": "核心识别色，建议整体占比不超过 10%",
            },
            "deepInk": {
                "hex": INK,
                "rgb": [15, 31, 27],
                "cmyk": [52, 0, 13, 88],
                "usage": "正文、标题与单色标志",
            },
            "coolPaper": {
                "hex": PAPER,
                "rgb": [243, 247, 245],
                "cmyk": [2, 0, 1, 3],
                "usage": "主要背景与留白",
            },
            "jadeMist": {
                "hex": JADE_LIGHT,
                "rgb": [221, 236, 231],
                "cmyk": [6, 0, 2, 7],
                "usage": "辅助底色、分区与表格",
            },
            "warmGoldSpecial": {
                "hex": GOLD,
                "rgb": [184, 153, 90],
                "usage": "仅用于烫金、金属、礼赠等特殊工艺，不作为数字主色",
            },
        },
        "typography": {
            "displayCN": "Noto Serif SC / 思源宋体",
            "bodyCN": "Noto Sans SC / 思源黑体",
            "displayEN": "Noto Serif SC Latin",
            "bodyEN": "Noto Sans SC Latin",
            "license": "SIL Open Font License 1.1",
        },
        "logo": {
            "clearspace": "X = 方印边长的 1/4",
            "minimumDigital": {
                "horizontal": "160 px",
                "mark": "20 px",
            },
            "minimumPrint": {
                "horizontal": "35 mm",
                "mark": "6 mm",
            },
        },
        "colorRatio": {
            "coolPaperAndWhite": 70,
            "deepInkAndNeutrals": 20,
            "qingJade": 10,
        },
    }
    (TOKENS_DIR / "qingyi-brand-tokens.json").write_text(
        json.dumps(data, ensure_ascii=False, indent=2),
        encoding="utf-8",
    )
    css = f""":root {{
  --qy-jade: {JADE};
  --qy-jade-dark: {JADE_DARK};
  --qy-jade-mist: {JADE_LIGHT};
  --qy-ink: {INK};
  --qy-mist: {MIST};
  --qy-paper: {PAPER};
  --qy-white: {WHITE};
  --qy-special-gold: {GOLD};

  --qy-font-display: "Noto Serif SC", "Source Han Serif SC", serif;
  --qy-font-body: "Noto Sans SC", "Source Han Sans SC", sans-serif;
}}
"""
    (TOKENS_DIR / "qingyi-brand-tokens.css").write_text(css, encoding="utf-8")


PAGE_W, PAGE_H = landscape(A4)
MARGIN = 42


def rgb(hex_value: str) -> Color:
    return HexColor(hex_value)


def register_pdf_fonts() -> None:
    pdfmetrics.registerFont(RLTTFont("QYSerif", str(FONT_SERIF)))
    pdfmetrics.registerFont(RLTTFont("QYSans", str(FONT_SANS)))


def draw_footer(c: canvas.Canvas, page_no: int, section: str) -> None:
    c.setStrokeColor(rgb(JADE_LIGHT))
    c.setLineWidth(0.8)
    c.line(MARGIN, 28, PAGE_W - MARGIN, 28)
    c.setFont("QYSans", 7.5)
    c.setFillColor(rgb(MIST))
    c.drawString(MARGIN, 15, f"QINGYI MEDIA · VISUAL IDENTITY v{VERSION}")
    c.drawCentredString(PAGE_W / 2, 15, section)
    c.drawRightString(PAGE_W - MARGIN, 15, f"{page_no:02d}")


def page_header(
    c: canvas.Canvas,
    page_no: int,
    section: str,
    title: str,
    subtitle: str = "",
) -> None:
    c.setFillColor(rgb(JADE))
    c.rect(0, PAGE_H - 10, PAGE_W, 10, stroke=0, fill=1)
    c.setFillColor(rgb(MIST))
    c.setFont("QYSans", 8)
    c.drawString(MARGIN, PAGE_H - 34, section.upper())
    c.setFillColor(rgb(INK))
    c.setFont("QYSerif", 25)
    c.drawString(MARGIN, PAGE_H - 70, title)
    if subtitle:
        c.setFillColor(rgb(MIST))
        c.setFont("QYSans", 9.5)
        c.drawString(MARGIN, PAGE_H - 91, subtitle)
    draw_footer(c, page_no, section)


def wrap_text(
    c: canvas.Canvas,
    text: str,
    x: float,
    y: float,
    width: float,
    font: str = "QYSans",
    size: float = 10,
    leading: float = 16,
    color: str = INK,
    max_lines: int | None = None,
) -> float:
    c.setFont(font, size)
    c.setFillColor(rgb(color))
    chars = max(8, int(width / (size * 0.95)))
    lines: list[str] = []
    for paragraph in text.split("\n"):
        if not paragraph:
            lines.append("")
            continue
        lines.extend(textwrap.wrap(paragraph, width=chars, break_long_words=True))
    if max_lines is not None:
        lines = lines[:max_lines]
    for line in lines:
        c.drawString(x, y, line)
        y -= leading
    return y


def card(
    c: canvas.Canvas,
    x: float,
    y: float,
    w: float,
    h: float,
    title: str,
    body: str,
    accent: str = JADE,
) -> None:
    c.setFillColor(rgb(PAPER))
    c.roundRect(x, y, w, h, 7, stroke=0, fill=1)
    c.setFillColor(rgb(accent))
    c.rect(x, y + h - 5, w, 5, stroke=0, fill=1)
    c.setFillColor(rgb(INK))
    c.setFont("QYSerif", 13)
    c.drawString(x + 16, y + h - 29, title)
    wrap_text(c, body, x + 16, y + h - 51, w - 32, size=8.5, leading=13, color=MIST)


def place_image(
    c: canvas.Canvas,
    path: Path,
    x: float,
    y: float,
    w: float,
    h: float,
    preserve: bool = True,
) -> None:
    c.drawImage(
        str(path),
        x,
        y,
        width=w,
        height=h,
        preserveAspectRatio=preserve,
        anchor="c",
        mask="auto",
    )


def generate_vi_pdf(exports: dict[str, Path]) -> Path:
    register_pdf_fonts()
    target = GUIDE_DIR / "QingyiMedia_VI_Guidelines_CN_v1.0.pdf"
    c = canvas.Canvas(str(target), pagesize=(PAGE_W, PAGE_H))
    c.setTitle("青意传媒视觉识别系统规范 v1.0")
    c.setAuthor("Qingyi Media")
    page_no = 1

    # 01 Cover
    c.setFillColor(rgb(PAPER))
    c.rect(0, 0, PAGE_W, PAGE_H, stroke=0, fill=1)
    c.setFillColor(rgb(JADE))
    c.rect(0, 0, PAGE_W * 0.29, PAGE_H, stroke=0, fill=1)
    place_image(c, exports["Mark_512px"], 64, 302, 130, 130)
    c.setFillColor(rgb(INK))
    c.setFont("QYSerif", 32)
    c.drawString(285, 365, "青意传媒")
    c.setFont("QYSans", 15)
    c.drawString(288, 330, "Q I N G Y I   M E D I A")
    c.setFillColor(rgb(MIST))
    c.setFont("QYSans", 13)
    c.drawString(288, 270, "视觉识别系统规范 / VISUAL IDENTITY GUIDELINES")
    c.setFont("QYSans", 9)
    c.drawString(288, 228, f"VERSION {VERSION} · {TODAY}")
    c.setFillColor(rgb(JADE))
    c.rect(288, 195, 90, 5, stroke=0, fill=1)
    c.showPage()
    page_no += 1

    # 02 Contents
    page_header(c, page_no, "Introduction", "目录 / Contents", "从品牌基础到资产应用的统一操作标准")
    cols = [
        (
            48,
            [
                ("01", "品牌基础", "定位、个性、设计原则"),
                ("02", "标志系统", "主标志、方印、字标"),
                ("03", "使用规范", "留白、尺寸、背景与禁用"),
                ("04", "色彩系统", "品牌色、比例与无障碍"),
            ],
        ),
        (
            300,
            [
                ("05", "字体系统", "中文、英文与信息层级"),
                ("06", "图像与版式", "摄影、图形语言、网格"),
                ("07", "语言与动效", "品牌语气、数字表现"),
                ("08", "应用模板", "名片、信纸、PPT、社媒"),
            ],
        ),
        (
            552,
            [
                ("09", "协作与生产", "联名、印刷、资产治理"),
                ("10", "文件索引", "交付文件与上线清单"),
            ],
        ),
    ]
    for x, items in cols:
        y = 435
        for number, title, desc in items:
            c.setFillColor(rgb(JADE))
            c.setFont("QYSans", 10)
            c.drawString(x, y, number)
            c.setFillColor(rgb(INK))
            c.setFont("QYSerif", 16)
            c.drawString(x + 34, y, title)
            c.setFillColor(rgb(MIST))
            c.setFont("QYSans", 8.5)
            c.drawString(x + 34, y - 22, desc)
            y -= 88
    c.showPage()
    page_no += 1

    # 03 Brand foundation
    page_header(c, page_no, "01 Brand Foundation", "品牌核心", "高端感来自克制、秩序与可信度，而非装饰堆叠")
    card(c, 48, 330, 220, 150, "品牌定位", "面向直播与短视频的创意内容公会，以创作者孵化、内容 IP、算法可见性与可持续变现为核心能力。")
    card(c, 288, 330, 220, 150, "品牌使命", "把个人创意转化为可持续的内容事业，让创作者获得专业支持、长期成长与透明合作。")
    card(c, 528, 330, 220, 150, "品牌承诺", "专业但不端着；高效但不急功近利；理解平台，更尊重创作者与受众之间真实的关系。")
    c.setFillColor(rgb(INK))
    c.setFont("QYSerif", 17)
    c.drawString(48, 265, "核心关键词")
    keywords = ["结构化", "可信赖", "有灵感", "真实感", "长期主义", "内容价值"]
    x = 48
    for word in keywords:
        w = 78
        c.setFillColor(rgb(JADE_LIGHT))
        c.roundRect(x, 210, w, 32, 16, stroke=0, fill=1)
        c.setFillColor(rgb(JADE_DARK))
        c.setFont("QYSans", 9)
        c.drawCentredString(x + w / 2, 221, word)
        x += w + 14
    c.showPage()
    page_no += 1

    # 04 Design principles
    page_header(c, page_no, "01 Brand Foundation", "设计原则", "品牌表达以 Structured / Trustful 为基座，以 Inspiring 为适量动态")
    principles = [
        ("01", "少而准确", "删除不增加信息或识别度的元素。让留白成为视觉资产。"),
        ("02", "秩序先行", "坚持清晰网格、左对齐、稳定间距与可预测的信息层级。"),
        ("03", "真实可信", "摄影与文案避免过度包装，展示真实人物、工作场景和可验证结果。"),
        ("04", "青色点睛", "青玉色用于识别与行动，不铺满所有界面；整体建议不超过 10%。"),
        ("05", "文化而现代", "宋体与方印提供文化气质，现代网格和黑体保证数字效率。"),
        ("06", "跨媒介一致", "网站、社媒、PPT、印刷与周边始终使用同一套标志、颜色和字体逻辑。"),
    ]
    for idx, (num, title, body) in enumerate(principles):
        col = idx % 3
        row = idx // 3
        x = 48 + col * 240
        y = 318 - row * 180
        c.setFillColor(rgb(JADE))
        c.setFont("QYSans", 10)
        c.drawString(x, y + 110, num)
        c.setFillColor(rgb(INK))
        c.setFont("QYSerif", 17)
        c.drawString(x, y + 78, title)
        wrap_text(c, body, x, y + 50, 205, size=9, leading=14, color=MIST)
    c.showPage()
    page_no += 1

    # 05 Logo overview
    page_header(c, page_no, "02 Logo System", "标志系统总览", "方印承载识别，中文字标表达名称，英文字标连接国际传播")
    place_image(c, exports["Primary_1200px"], 58, 292, 660, 150)
    c.setFillColor(rgb(JADE_LIGHT))
    c.rect(48, 105, 220, 145, stroke=0, fill=1)
    place_image(c, exports["Mark_512px"], 90, 118, 120, 120)
    c.setFillColor(rgb(INK))
    c.setFont("QYSerif", 13)
    c.drawString(300, 215, "主标志 / Primary")
    wrap_text(c, "正式且完整的品牌签名。优先用于网站页头、公司资料、名片与演示文稿。", 300, 190, 185, size=8.5, leading=13, color=MIST)
    c.setFont("QYSerif", 13)
    c.setFillColor(rgb(INK))
    c.drawString(530, 215, "方印 / Mark")
    wrap_text(c, "用于头像、应用图标、favicon、印章式落款及空间极小的数字场景。", 530, 190, 185, size=8.5, leading=13, color=MIST)
    c.showPage()
    page_no += 1

    # 06 Primary logo
    page_header(c, page_no, "02 Logo System", "主标志横式", "默认版本：青玉方印 + 深墨中文字标 + 英文辅助字标")
    c.setFillColor(white)
    c.roundRect(48, 180, 745, 300, 8, stroke=0, fill=1)
    place_image(c, exports["Primary_1200px"], 90, 260, 660, 143)
    c.setFillColor(rgb(MIST))
    c.setFont("QYSans", 8.5)
    c.drawString(60, 145, "优先使用场景：公司官网、合同封面、名片、PPT、信纸、媒体资料包。")
    c.drawString(60, 124, "未经许可不得重新排字、改变比例或将方印与字标分离后重新组合。")
    c.showPage()
    page_no += 1

    # 07 Construction
    page_header(c, page_no, "02 Logo System", "方印结构与设计含义", "原创结构：圆角方印承载“青”，兼具东方印记与数字界面的稳定轮廓")
    c.setFillColor(rgb(JADE_LIGHT))
    c.roundRect(58, 170, 330, 330, 10, stroke=0, fill=1)
    place_image(c, exports["Mark_512px"], 93, 205, 260, 260)
    c.setFillColor(rgb(INK))
    c.setFont("QYSerif", 16)
    c.drawString(445, 435, "构成逻辑")
    points = [
        "方形：制度、组织与稳定的内容生产体系。",
        "圆角：降低传统印章的距离感，适应数字产品。",
        "“青”：直指品牌名，也代表生长、年轻与持续更新。",
        "青玉色：区别于常见红印，以专业、清醒和长期价值建立记忆。",
        "内层细线：只作为高分辨率版本的精致细节，小尺寸可自然弱化。",
    ]
    y = 392
    for point in points:
        c.setFillColor(rgb(JADE))
        c.circle(452, y + 3, 2.4, stroke=0, fill=1)
        y = wrap_text(c, point, 466, y + 7, 300, size=9, leading=14, color=MIST) - 12
    c.showPage()
    page_no += 1

    # 08 Clearspace
    page_header(c, page_no, "03 Usage Rules", "安全留白", "X = 方印边长的 1/4；任何文字、图形、裁切线和页面边缘不得进入")
    place_image(c, exports["Primary_1200px"], 118, 265, 600, 130)
    c.setStrokeColor(rgb(JADE))
    c.setDash(5, 4)
    c.rect(80, 220, 680, 220, stroke=1, fill=0)
    c.setDash()
    c.setFillColor(rgb(JADE))
    c.setFont("QYSans", 12)
    c.drawString(82, 457, "X")
    c.drawString(743, 457, "X")
    wrap_text(c, "联名、社交头像和小尺寸应用同样遵守留白。若版面不足，应缩小标志而不是压缩留白。", 100, 155, 640, size=10, leading=16, color=MIST)
    c.showPage()
    page_no += 1

    # 09 Minimum size
    page_header(c, page_no, "03 Usage Rules", "最小尺寸", "以可读性为准，尺寸低于阈值时只使用方印")
    card(c, 48, 295, 220, 175, "横式标志 · 数字", "最小宽度 160 px\n低于此尺寸时英文辅助字标可能失去清晰度。")
    card(c, 288, 295, 220, 175, "横式标志 · 印刷", "最小宽度 35 mm\n特殊纸张或反白印刷应先做打样。")
    card(c, 528, 295, 220, 175, "方印 · 通用", "数字最小 20 px\n印刷最小 6 mm\n16 px favicon 使用专用简化文件。")
    c.setFillColor(rgb(INK))
    c.setFont("QYSerif", 15)
    c.drawString(48, 235, "尺寸切换原则")
    wrap_text(c, "≥160 px 使用完整横式；20–159 px 视空间使用方印或字标；≤19 px 使用专用 favicon，不得直接缩小完整标志。", 48, 205, 700, size=9.5, leading=16, color=MIST)
    c.showPage()
    page_no += 1

    # 10 Variants
    page_header(c, page_no, "03 Usage Rules", "色彩版本", "优先顺序：标准彩色 → 反白 → 单色黑；不创建其他配色版本")
    c.setFillColor(white)
    c.rect(48, 320, 230, 150, stroke=0, fill=1)
    place_image(c, exports["Mark_512px"], 100, 330, 125, 125)
    c.setFillColor(rgb(INK))
    c.setFont("QYSans", 9)
    c.drawCentredString(163, 296, "标准彩色 / 首选")
    c.setFillColor(rgb(INK))
    c.rect(303, 320, 230, 150, stroke=0, fill=1)
    c.setFillColor(white)
    c.roundRect(355, 330, 125, 125, 16, stroke=1, fill=0)
    c.setFont("QYSerif", 75)
    c.drawCentredString(417, 360, "青")
    c.setFillColor(rgb(INK))
    c.setFont("QYSans", 9)
    c.drawCentredString(418, 296, "反白 / 深色背景")
    c.setFillColor(white)
    c.rect(558, 320, 230, 150, stroke=0, fill=1)
    # monochrome preview
    c.setStrokeColor(rgb(INK))
    c.roundRect(610, 330, 125, 125, 16, stroke=1, fill=0)
    c.setFillColor(rgb(INK))
    c.setFont("QYSerif", 75)
    c.drawCentredString(672, 360, "青")
    c.setFont("QYSans", 9)
    c.drawCentredString(673, 296, "单色黑 / 受限工艺")
    wrap_text(c, "烫金、压凹、丝印、刺绣等特殊工艺使用单色版。暖金色仅代表工艺材质，不是数字传播中的替代品牌色。", 70, 215, 690, size=9.5, leading=16, color=MIST)
    c.showPage()
    page_no += 1

    # 11 Backgrounds
    page_header(c, page_no, "03 Usage Rules", "背景控制", "对比度和识别性优先，照片背景应选择干净区域或加纯色承载")
    bg_specs = [
        (48, PAPER, "浅色背景", "使用标准彩色标志"),
        (288, INK, "深色背景", "使用反白标志"),
        (528, JADE, "青玉背景", "使用反白标志"),
    ]
    for x, color, title, desc in bg_specs:
        c.setFillColor(rgb(color))
        c.roundRect(x, 270, 220, 195, 8, stroke=0, fill=1)
        if color == PAPER:
            place_image(c, exports["Mark_512px"], x + 60, 315, 100, 100)
            label_color = INK
        else:
            c.setStrokeColor(white)
            c.setLineWidth(4)
            c.roundRect(x + 60, 315, 100, 100, 14, stroke=1, fill=0)
            c.setFillColor(white)
            c.setFont("QYSerif", 58)
            c.drawCentredString(x + 110, 340, "青")
            label_color = WHITE
        c.setFillColor(rgb(label_color))
        c.setFont("QYSerif", 12)
        c.drawString(x + 18, 294, title)
        c.setFont("QYSans", 8)
        c.drawString(x + 18, 280, desc)
    wrap_text(c, "禁止放在复杂、低对比度或与青玉色接近的照片区域。若无法保证清晰，应使用纸白或深墨色承载块。", 48, 205, 700, size=9.5, leading=16, color=MIST)
    c.showPage()
    page_no += 1

    # 12 Incorrect uses
    page_header(c, page_no, "03 Usage Rules", "禁止用法", "保持资产完整，不以“创意处理”为理由破坏长期识别")
    wrongs = [
        "不得拉伸、压缩或旋转",
        "不得改变方印与字标比例",
        "不得替换字形或重新排字",
        "不得添加阴影、描边、渐变",
        "不得使用未定义的颜色",
        "不得裁切方印或完整标志",
        "不得置于低对比复杂背景",
        "不得在留白区添加其他元素",
    ]
    for idx, text in enumerate(wrongs):
        col = idx % 4
        row = idx // 4
        x = 48 + col * 184
        y = 310 - row * 170
        c.setFillColor(rgb(PAPER))
        c.roundRect(x, y, 160, 135, 6, stroke=0, fill=1)
        c.setStrokeColor(HexColor("#B33A3A"))
        c.setLineWidth(3)
        c.line(x + 40, y + 95, x + 120, y + 35)
        c.line(x + 120, y + 95, x + 40, y + 35)
        wrap_text(c, text, x + 12, y + 22, 136, size=8, leading=12, color=MIST, max_lines=2)
    c.showPage()
    page_no += 1

    # 13 Color palette
    page_header(c, page_no, "04 Color", "品牌色彩", "青玉为识别色，深墨与纸白建立高级、清晰和可持续的视觉基础")
    palette = [
        (JADE, "青玉 / QING JADE", "HEX 0C8A6B · RGB 12 138 107 · CMYK 91 0 22 46"),
        (INK, "深墨 / DEEP INK", "HEX 0F1F1B · RGB 15 31 27 · CMYK 52 0 13 88"),
        (PAPER, "冷纸 / COOL PAPER", "HEX F3F7F5 · RGB 243 247 245 · CMYK 2 0 1 3"),
        (JADE_LIGHT, "青雾 / JADE MIST", "HEX DDECE7 · RGB 221 236 231 · CMYK 6 0 2 7"),
    ]
    for idx, (color, name, specs) in enumerate(palette):
        x = 48 + (idx % 2) * 375
        y = 310 - (idx // 2) * 170
        c.setFillColor(rgb(color))
        c.roundRect(x, y, 150, 120, 6, stroke=0, fill=1)
        c.setFillColor(rgb(INK))
        c.setFont("QYSerif", 12)
        c.drawString(x + 170, y + 86, name)
        c.setFillColor(rgb(MIST))
        c.setFont("QYSans", 7.4)
        c.drawString(x + 170, y + 59, specs)
        if color == PAPER:
            c.setStrokeColor(rgb(JADE_LIGHT))
            c.roundRect(x, y, 150, 120, 6, stroke=1, fill=0)
    c.showPage()
    page_no += 1

    # 14 Color ratio
    page_header(c, page_no, "04 Color", "配色比例与特殊工艺", "建议 70 / 20 / 10：留白主导，深墨承载信息，青玉用于识别和行动")
    x0, y0, total_w, h = 80, 350, 680, 90
    segments = [
        (0.70, PAPER, "70% 纸白 / 留白"),
        (0.20, INK, "20% 深墨 / 中性色"),
        (0.10, JADE, "10% 青玉"),
    ]
    cursor = x0
    for ratio, color, label in segments:
        w = total_w * ratio
        c.setFillColor(rgb(color))
        c.rect(cursor, y0, w, h, stroke=0, fill=1)
        label_color = WHITE if color == INK or color == JADE else INK
        c.setFillColor(rgb(label_color))
        c.setFont("QYSans", 9)
        c.drawCentredString(cursor + w / 2, y0 + 40, label)
        cursor += w
    card(c, 80, 150, 300, 130, "暖金 / 特殊工艺", "可用于烫金、金属铭牌、压凹、礼赠包装等高级触点。数字屏幕和日常文档不把暖金当作主色。", accent=GOLD)
    card(c, 420, 150, 340, 130, "无障碍原则", "正文与背景保持至少 WCAG AA 对比。不能只用颜色传递状态；必须同时结合文字、图标或形状。")
    c.showPage()
    page_no += 1

    # 15 Typography
    page_header(c, page_no, "05 Typography", "字体系统", "全部推荐字体均为开源 SIL OFL，避免商业授权不确定性")
    c.setFillColor(rgb(INK))
    c.setFont("QYSerif", 38)
    c.drawString(48, 410, "思源宋体 / Noto Serif SC")
    c.setFont("QYSerif", 18)
    c.drawString(48, 365, "用于品牌标题、中文名称、封面与强调性短句")
    c.setFillColor(rgb(MIST))
    c.setFont("QYSans", 9)
    c.drawString(48, 337, "推荐字重：SemiBold 600 / Bold 700；避免用于长篇小字号正文。")
    c.setFillColor(rgb(JADE))
    c.rect(48, 300, 110, 5, stroke=0, fill=1)
    c.setFillColor(rgb(INK))
    c.setFont("QYSans", 32)
    c.drawString(48, 230, "思源黑体 / Noto Sans SC")
    c.setFont("QYSans", 17)
    c.drawString(48, 192, "用于正文、数据、导航、说明、表格与数字产品界面")
    c.setFillColor(rgb(MIST))
    c.setFont("QYSans", 9)
    c.drawString(48, 164, "推荐字重：Regular 400 / Medium 500 / Bold 700。")
    c.setFillColor(rgb(PAPER))
    c.roundRect(540, 140, 210, 325, 8, stroke=0, fill=1)
    c.setFillColor(rgb(INK))
    c.setFont("QYSerif", 56)
    c.drawString(575, 365, "青意")
    c.setFont("QYSerif", 28)
    c.drawString(575, 310, "内容与长期价值")
    c.setFont("QYSans", 20)
    c.drawString(575, 245, "清晰、可信、可持续")
    c.setFont("QYSans", 11)
    c.drawString(575, 200, "QINGYI MEDIA")
    c.showPage()
    page_no += 1

    # 16 Type hierarchy
    page_header(c, page_no, "05 Typography", "信息层级", "每个版面只设一个最强元素；相同层级保持一致尺寸、字重和间距")
    c.setFillColor(rgb(JADE))
    c.setFont("QYSans", 8)
    c.drawString(48, 440, "H1 / 40–64 PX / SERIF SEMIBOLD")
    c.setFillColor(rgb(INK))
    c.setFont("QYSerif", 34)
    c.drawString(48, 390, "把个人创意做成事业")
    c.setFillColor(rgb(JADE))
    c.setFont("QYSans", 8)
    c.drawString(48, 330, "H2 / 24–36 PX / SERIF SEMIBOLD")
    c.setFillColor(rgb(INK))
    c.setFont("QYSerif", 22)
    c.drawString(48, 292, "内容 IP 与商业变现")
    c.setFillColor(rgb(JADE))
    c.setFont("QYSans", 8)
    c.drawString(48, 238, "BODY / 16–18 PX / SANS REGULAR")
    wrap_text(c, "正文保持左对齐，不两端对齐，不使用过长行宽。推荐每行约 30–42 个中文字符，段落间距应大于行距。", 48, 205, 560, size=11, leading=19, color=INK)
    c.setFillColor(rgb(PAPER))
    c.roundRect(630, 160, 120, 280, 6, stroke=0, fill=1)
    c.setFillColor(rgb(MIST))
    c.setFont("QYSans", 8)
    c.drawCentredString(690, 400, "字重不超过 3 种")
    c.drawCentredString(690, 370, "左对齐")
    c.drawCentredString(690, 340, "短标题")
    c.drawCentredString(690, 310, "充足行距")
    c.drawCentredString(690, 280, "明确段落")
    c.drawCentredString(690, 250, "不用花字")
    c.showPage()
    page_no += 1

    # 17 Photography
    page_header(c, page_no, "06 Image & Layout", "摄影方向", "真实人物、真实工作、真实互动；避免影棚式假笑和过度磨皮")
    card(c, 48, 310, 220, 160, "人物", "优先自然表情、正在创作或互动的瞬间。视线、动作与环境共同讲故事。")
    card(c, 288, 310, 220, 160, "场景", "直播间、排练、复盘、幕后协作与平台内容生产现场，保持真实细节。")
    card(c, 528, 310, 220, 160, "构图", "使用三分法、清晰主体和可用于排字的留白。单张有力图片优于多张弱图片堆叠。")
    c.setFillColor(rgb(INK))
    c.setFont("QYSerif", 15)
    c.drawString(48, 245, "避免")
    wrap_text(c, "陈旧网红感、廉价霓虹、夸张磨皮、无关素材图、密集拼贴、低清截图、无授权图片，以及把文字直接压在复杂人脸或背景上。", 48, 215, 700, size=9.5, leading=16, color=MIST)
    c.showPage()
    page_no += 1

    # 18 Graphic language
    page_header(c, page_no, "06 Image & Layout", "图形语言", "从“方印”提取圆角方框、内线与青色定位点，形成可扩展系统")
    c.setStrokeColor(rgb(JADE))
    c.setLineWidth(4)
    for i in range(3):
        c.roundRect(80 + i * 120, 285, 90, 90, 13, stroke=1, fill=0)
    c.setFillColor(rgb(JADE))
    for i in range(5):
        c.circle(510 + i * 38, 330, 5 + i * 1.5, stroke=0, fill=1)
    c.setFillColor(rgb(JADE_LIGHT))
    c.roundRect(80, 150, 290, 80, 12, stroke=0, fill=1)
    c.setFillColor(rgb(JADE))
    c.rect(80, 150, 12, 80, stroke=0, fill=1)
    c.setFillColor(rgb(INK))
    c.setFont("QYSerif", 14)
    c.drawString(112, 194, "结构化信息承载块")
    c.setFillColor(rgb(MIST))
    c.setFont("QYSans", 8.5)
    c.drawString(112, 173, "用于数据、案例、步骤与关键信息")
    wrap_text(c, "这些图形是辅助语言，不是新 Logo。不可把圆角方框、定位点或“青”字重新拼成其他标志。", 445, 210, 300, size=9.5, leading=16, color=MIST)
    c.showPage()
    page_no += 1

    # 19 Layout grid
    page_header(c, page_no, "06 Image & Layout", "版式与网格", "使用 12 栏数字网格；印刷推荐 6 栏。优先左对齐与非对称平衡")
    grid_x, grid_y, grid_w, grid_h = 48, 145, 700, 315
    gutter = 8
    col_w = (grid_w - gutter * 11) / 12
    for i in range(12):
        c.setFillColor(Color(0.047, 0.541, 0.420, alpha=0.12))
        c.rect(grid_x + i * (col_w + gutter), grid_y, col_w, grid_h, stroke=0, fill=1)
    c.setFillColor(rgb(INK))
    c.setFont("QYSerif", 20)
    c.drawString(grid_x + col_w + gutter, grid_y + grid_h - 65, "一个最强标题")
    c.setFillColor(rgb(MIST))
    c.setFont("QYSans", 9)
    c.drawString(grid_x + col_w + gutter, grid_y + grid_h - 92, "视觉流向从左到右、从上到下")
    c.setFillColor(rgb(JADE))
    c.rect(grid_x + 7 * (col_w + gutter), grid_y + 55, 4 * col_w + 3 * gutter, 145, stroke=0, fill=1)
    c.setFillColor(white)
    c.setFont("QYSans", 10)
    c.drawCentredString(grid_x + 9 * (col_w + gutter), grid_y + 120, "主图 / 数据 / 行动")
    c.showPage()
    page_no += 1

    # 20 Tone
    page_header(c, page_no, "07 Voice & Motion", "品牌语气", "专业但不学术腔；自信但不夸张；理解平台，也尊重创作者")
    tones = [
        ("清楚", "先说结论，再给行动；减少空泛形容词。"),
        ("真诚", "不制造保底、收入或流量承诺；具体条款以正式沟通为准。"),
        ("专业", "使用内容 IP、算法可见性、平台分发等行业术语，但解释其实际价值。"),
        ("有温度", "把创作者视为长期伙伴，不使用“收割”“造神”等短期投机语言。"),
    ]
    for idx, (title, desc) in enumerate(tones):
        x = 48 + (idx % 2) * 375
        y = 305 - (idx // 2) * 160
        c.setFillColor(rgb(JADE))
        c.circle(x + 18, y + 95, 18, stroke=0, fill=1)
        c.setFillColor(white)
        c.setFont("QYSerif", 12)
        c.drawCentredString(x + 18, y + 90, str(idx + 1))
        c.setFillColor(rgb(INK))
        c.setFont("QYSerif", 16)
        c.drawString(x + 52, y + 95, title)
        wrap_text(c, desc, x + 52, y + 66, 260, size=9, leading=14, color=MIST)
    c.showPage()
    page_no += 1

    # 21 Motion
    page_header(c, page_no, "07 Voice & Motion", "数字动效原则", "动效服务信息反馈，不把高端感理解为大量发光、弹跳或粒子")
    card(c, 48, 315, 220, 155, "进入", "元素以 160–240ms 淡入或轻微位移进入。主标志不旋转、不拆字、不弹跳。")
    card(c, 288, 315, 220, 155, "交互", "按钮悬停使用颜色与 1–2px 位移反馈；避免强烈缩放和连续循环动画。")
    card(c, 528, 315, 220, 155, "视频落版", "方印先出现，中文字标随后淡入，英文辅助字标最后出现；总时长建议 0.8–1.2s。")
    wrap_text(c, "聊天 AI 球体可保留轻微高光和拖拽反馈，但不应改变核心方印标志的规范版本。UI 动效属于产品表达，不等于 Logo 本体。", 48, 235, 700, size=9.5, leading=16, color=MIST)
    c.showPage()
    page_no += 1

    # 22 Social
    page_header(c, page_no, "08 Applications", "社交媒体与头像", "头像只用方印；内容模板使用 70/20/10 配色与单一信息焦点")
    place_image(c, exports["Mark_512px"], 75, 235, 220, 220)
    c.setFillColor(rgb(INK))
    c.setFont("QYSerif", 16)
    c.drawString(350, 410, "头像")
    wrap_text(c, "使用 QingyiMedia_Mark_Jade.svg 或 800px PNG。不得把完整横式标志塞入圆形头像。", 350, 380, 360, size=9.5, leading=16, color=MIST)
    c.setFont("QYSerif", 16)
    c.setFillColor(rgb(INK))
    c.drawString(350, 300, "内容卡片")
    wrap_text(c, "每张图只表达一个主信息。标题短、图片真实、青玉色只做识别条或行动提示。推荐保留 10% 以上安全边距。", 350, 270, 360, size=9.5, leading=16, color=MIST)
    c.showPage()
    page_no += 1

    # 23 Business card
    page_header(c, page_no, "08 Applications", "名片", "正面强化品牌记忆；背面提供清晰、可扫描的联系信息")
    c.setFillColor(rgb(JADE))
    c.roundRect(60, 275, 340, 194, 8, stroke=0, fill=1)
    place_image(c, exports["Primary_1200px"], 100, 325, 260, 70)
    c.setFillColor(rgb(PAPER))
    c.roundRect(440, 275, 340, 194, 8, stroke=0, fill=1)
    c.setFillColor(rgb(INK))
    c.setFont("QYSerif", 14)
    c.drawString(465, 420, "姓名 / NAME")
    c.setFillColor(rgb(MIST))
    c.setFont("QYSans", 8)
    c.drawString(465, 395, "职务 / TITLE")
    c.drawString(610, 350, "contact@qingyimedia.cn")
    c.drawString(610, 330, "qingyi.onrender.com")
    wrap_text(c, "成品建议：90×54 mm 或 88×50 mm，3 mm 出血。纸张优先高白或自然白厚卡；高级版本可在方印处使用青色专色、压凹或暖金烫印。", 60, 220, 700, size=9.5, leading=16, color=MIST)
    c.showPage()
    page_no += 1

    # 24 Letterhead
    page_header(c, page_no, "08 Applications", "信纸与正式文件", "标志固定于左上；页脚仅保留法定名称与必要联系信息")
    c.setFillColor(white)
    c.roundRect(205, 105, 430, 365, 5, stroke=0, fill=1)
    place_image(c, exports["Primary_1200px"], 235, 400, 190, 42)
    c.setStrokeColor(rgb(JADE_LIGHT))
    c.line(235, 382, 605, 382)
    c.setFillColor(rgb(INK))
    c.setFont("QYSerif", 16)
    c.drawString(235, 330, "文件标题")
    c.setFillColor(rgb(MIST))
    c.setFont("QYSans", 7)
    for i in range(7):
        c.rect(235, 295 - i * 23, 330 - (i % 3) * 35, 3, stroke=0, fill=1)
    c.setStrokeColor(rgb(JADE_LIGHT))
    c.line(235, 135, 605, 135)
    c.setFont("QYSans", 6.5)
    c.drawString(235, 120, "青意贸易（福建福清市）有限公司")
    c.drawRightString(605, 120, "QINGYI MEDIA")
    c.showPage()
    page_no += 1

    # 25 Presentation
    page_header(c, page_no, "08 Applications", "演示文稿", "封面建立品牌识别，内容页以网格、数据和真实案例为主")
    c.setFillColor(rgb(PAPER))
    c.roundRect(60, 210, 720, 260, 8, stroke=0, fill=1)
    c.setFillColor(rgb(JADE))
    c.roundRect(60, 210, 150, 260, 8, stroke=0, fill=1)
    c.rect(190, 210, 20, 260, stroke=0, fill=1)
    c.setFillColor(white)
    c.setFont("QYSerif", 28)
    c.drawString(95, 375, "青")
    c.setFillColor(rgb(INK))
    c.setFont("QYSerif", 24)
    c.drawString(260, 355, "演示文稿标题")
    c.setFillColor(rgb(JADE))
    c.rect(260, 320, 70, 4, stroke=0, fill=1)
    c.setFillColor(rgb(MIST))
    c.setFont("QYSans", 10)
    c.drawString(260, 290, "副标题 / PRESENTATION SUBTITLE")
    wrap_text(c, "建议 16:9；单页不超过一个主结论；图表使用深墨、青玉和青雾三色；装饰性图形不得压过内容。", 60, 165, 700, size=9.5, leading=16, color=MIST)
    c.showPage()
    page_no += 1

    # 26 Co-branding
    page_header(c, page_no, "09 Collaboration", "联合品牌", "双方视觉权重依据合作关系确定，保持各自留白并沿共同基线对齐")
    place_image(c, exports["Mark_512px"], 90, 300, 120, 120)
    c.setStrokeColor(rgb(JADE_LIGHT))
    c.setLineWidth(2)
    c.line(265, 300, 265, 420)
    c.setFillColor(rgb(PAPER))
    c.roundRect(335, 310, 230, 100, 8, stroke=0, fill=1)
    c.setFillColor(rgb(MIST))
    c.setFont("QYSans", 13)
    c.drawCentredString(450, 355, "合作伙伴标志区域")
    c.setStrokeColor(rgb(JADE))
    c.setDash(5, 4)
    c.rect(65, 275, 170, 170, stroke=1, fill=0)
    c.rect(310, 275, 280, 170, stroke=1, fill=0)
    c.setDash()
    wrap_text(c, "平等合作：两方标志视觉高度相当。主办/支持关系：主标志可更大，但仍不得侵入对方安全留白。禁止把双方标志永久合成为一个新 Logo。", 90, 215, 620, size=9.5, leading=16, color=MIST)
    c.showPage()
    page_no += 1

    # 27 Production
    page_header(c, page_no, "09 Production", "生产与输出", "不同媒介使用正确文件，避免截图、低清和色彩漂移")
    specs = [
        ("SVG", "网站、App、数字界面、印刷源文件；首选矢量格式。"),
        ("PNG", "社交平台、办公软件与无法使用 SVG 的数字场景；保持透明背景。"),
        ("PDF", "送印、审阅和跨设备交换；保留矢量结构。"),
        ("CMYK", "印刷前由供应商按纸张和工艺打样；本规范 CMYK 仅为起始参考。"),
        ("专色/工艺", "青玉专色需实物打样；暖金只用于烫金、金属和高端礼赠。"),
        ("可访问性", "数字内容检查 WCAG AA；图片提供替代文本；不要只靠颜色表达信息。"),
    ]
    for idx, (title, desc) in enumerate(specs):
        x = 48 + (idx % 3) * 240
        y = 315 - (idx // 3) * 170
        card(c, x, y, 215, 140, title, desc)
    c.showPage()
    page_no += 1

    # 28 Governance
    page_header(c, page_no, "09 Governance", "资产治理与审批", "统一文件来源，避免多人各自重画造成品牌漂移")
    steps = [
        ("1", "使用官方文件", "只从本交付包或后续品牌资产库获取标志。"),
        ("2", "设计自检", "检查版本、留白、尺寸、颜色、字体、对比度和图片授权。"),
        ("3", "关键物料复核", "官网、合同、媒体包、广告投放、联名与大批量印刷上线前复核。"),
        ("4", "版本管理", "修改规范时提升版本号并归档旧文件；禁止静默覆盖。"),
    ]
    y = 415
    for num, title, desc in steps:
        c.setFillColor(rgb(JADE))
        c.circle(70, y, 18, stroke=0, fill=1)
        c.setFillColor(white)
        c.setFont("QYSans", 10)
        c.drawCentredString(70, y - 4, num)
        c.setFillColor(rgb(INK))
        c.setFont("QYSerif", 14)
        c.drawString(110, y + 5, title)
        c.setFillColor(rgb(MIST))
        c.setFont("QYSans", 8.5)
        c.drawString(110, y - 18, desc)
        y -= 88
    c.showPage()
    page_no += 1

    # 29 Asset index
    page_header(c, page_no, "10 Asset Index", "交付文件索引", "所有文件按用途分类；Logo SVG 中的品牌字形均已转为矢量轮廓")
    groups = [
        ("01_Logo_Source", "主标志横式、反白、单色、竖式、方印、字标、favicon、留白示意"),
        ("02_Exports", "透明 PNG、多尺寸图标、ICO、矢量 PDF 与预览板"),
        ("03_VI_Guidelines", "本规范 PDF 与可编辑 HTML 版本"),
        ("04_Templates", "名片、A4 信纸、16:9 PPT 封面、社媒方图、邮件签名"),
        ("05_Brand_Tokens", "颜色、字体与 Logo 尺寸的 JSON / CSS 设计令牌"),
        ("06_Documentation", "中文使用说明、字体来源、原创与参考说明、校验值"),
    ]
    y = 430
    for folder, desc in groups:
        c.setFillColor(rgb(JADE))
        c.setFont("QYSans", 10)
        c.drawString(55, y, folder)
        c.setFillColor(rgb(MIST))
        c.setFont("QYSans", 8.5)
        c.drawString(220, y, desc)
        c.setStrokeColor(rgb(JADE_LIGHT))
        c.line(55, y - 16, 760, y - 16)
        y -= 58
    c.showPage()
    page_no += 1

    # 30 Checklist
    page_header(c, page_no, "10 Checklist", "上线前检查清单", "每次发布前完成；高端感来自长期一致，而不是一次性的视觉效果")
    checklist = [
        "使用正确 Logo 版本且未变形、重排或加效果",
        "安全留白和最小尺寸符合规范",
        "色彩比例克制，青玉色没有被滥用",
        "字体来自指定开源字体家族，信息层级清晰",
        "图像真实、清晰、获得授权并设置替代文本",
        "正文和按钮对比度符合 WCAG AA",
        "联名双方标志权重与留白正确",
        "导出格式、分辨率、色彩模式适合最终媒介",
        "关键物料已经过品牌负责人复核",
    ]
    y = 438
    for item in checklist:
        c.setStrokeColor(rgb(JADE))
        c.setLineWidth(1.5)
        c.rect(55, y - 8, 14, 14, stroke=1, fill=0)
        c.setFillColor(rgb(INK))
        c.setFont("QYSans", 9.5)
        c.drawString(85, y - 5, item)
        y -= 39
    c.setFillColor(rgb(JADE))
    c.setFont("QYSerif", 16)
    c.drawRightString(PAGE_W - 48, 72, "青意，生长于长期价值。")
    c.showPage()

    c.save()
    return target


def create_html_guide() -> Path:
    target = GUIDE_DIR / "QingyiMedia_VI_QuickGuide.html"
    html = f"""<!doctype html>
<html lang="zh-CN">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>青意传媒 VI 快速规范</title>
<style>
  :root{{--jade:{JADE};--ink:{INK};--paper:{PAPER};--mist:{MIST};--pale:{JADE_LIGHT};}}
  *{{box-sizing:border-box}} body{{margin:0;background:var(--paper);color:var(--ink);
  font-family:"Noto Sans SC","Microsoft YaHei",sans-serif;line-height:1.75}}
  header,main,footer{{max-width:1080px;margin:auto;padding:48px}}
  header{{min-height:55vh;display:grid;align-content:center}}
  h1,h2{{font-family:"Noto Serif SC","SimSun",serif;font-weight:650}}
  h1{{font-size:52px;margin:24px 0 0}} h2{{font-size:28px;margin-top:56px}}
  .logo{{width:min(760px,100%);display:block}} .grid{{display:grid;grid-template-columns:repeat(3,1fr);gap:20px}}
  .card{{background:white;padding:24px;border-top:5px solid var(--jade)}} .swatch{{height:120px;border-radius:8px}}
  code{{background:white;padding:3px 7px}} table{{width:100%;border-collapse:collapse;background:white}}
  th,td{{padding:14px;text-align:left;border-bottom:1px solid var(--pale)}}
  .ratio{{display:flex;height:80px}} .ratio div{{display:grid;place-items:center}}
  @media(max-width:720px){{header,main,footer{{padding:28px}}.grid{{grid-template-columns:1fr}}h1{{font-size:38px}}}}
</style>
</head>
<body>
<header>
  <img class="logo" src="../01_Logo_Source/QingyiMedia_Logo_Primary_Horizontal.svg" alt="青意传媒">
  <h1>视觉识别快速规范</h1>
  <p>QINGYI MEDIA VISUAL IDENTITY · VERSION {VERSION}</p>
</header>
<main>
  <h2>品牌方向</h2>
  <div class="grid">
    <div class="card"><b>结构化</b><p>稳定、整齐、清晰、严谨。</p></div>
    <div class="card"><b>可信赖</b><p>真诚、实际、专业、对话。</p></div>
    <div class="card"><b>有灵感</b><p>新鲜、敏捷、有生命力，但不过度喧闹。</p></div>
  </div>
  <h2>Logo 使用</h2>
  <table>
    <tr><th>场景</th><th>文件</th><th>最小尺寸</th></tr>
    <tr><td>网站、资料、名片</td><td>Primary_Horizontal.svg</td><td>数字 160px / 印刷 35mm</td></tr>
    <tr><td>头像、App、favicon</td><td>Mark_Jade.svg</td><td>数字 20px / 印刷 6mm</td></tr>
    <tr><td>深色背景</td><td>Primary_Reversed.svg</td><td>同上</td></tr>
  </table>
  <p>安全留白：<b>X = 方印边长的 1/4</b>。禁止变形、重排、改色、加阴影、加渐变或置于低对比背景。</p>
  <h2>色彩</h2>
  <div class="grid">
    <div><div class="swatch" style="background:{JADE}"></div><b>青玉 {JADE}</b></div>
    <div><div class="swatch" style="background:{INK}"></div><b>深墨 {INK}</b></div>
    <div><div class="swatch" style="background:{PAPER};border:1px solid {JADE_LIGHT}"></div><b>冷纸 {PAPER}</b></div>
  </div>
  <h2>推荐比例</h2>
  <div class="ratio"><div style="width:70%;background:white">70% 留白</div><div style="width:20%;background:{INK};color:white">20% 深墨</div><div style="width:10%;background:{JADE};color:white">10% 青玉</div></div>
  <h2>字体</h2>
  <p><b>标题：</b>Noto Serif SC（思源宋体）SemiBold / Bold<br>
     <b>正文：</b>Noto Sans SC（思源黑体）Regular / Medium<br>
     两者均采用 SIL Open Font License 1.1。</p>
  <h2>品牌语气</h2>
  <p>清楚、真诚、专业、有温度。先说结论，再给行动；不作无法验证的收入或流量承诺；使用行业术语时解释实际价值。</p>
</main>
<footer>© {date.today().year} Qingyi Media · 完整规则见 PDF 规范书。</footer>
</body>
</html>"""
    target.write_text(html, encoding="utf-8")
    return target


def create_docs() -> None:
    readme = f"""# 青意传媒视觉识别系统（VI）交付包

版本：{VERSION}  
生成日期：{TODAY}

## 快速选择

- 网站页头、公司资料、名片：`01_Logo_Source/QingyiMedia_Logo_Primary_Horizontal.svg`
- 深色背景：`01_Logo_Source/QingyiMedia_Logo_Primary_Reversed.svg`
- 头像、App、favicon：`01_Logo_Source/QingyiMedia_Mark_Jade.svg`
- 只允许单色的工艺：`01_Logo_Source/QingyiMedia_Logo_Monochrome_Black.svg`
- 完整使用规范：`03_VI_Guidelines/QingyiMedia_VI_Guidelines_CN_v1.0.pdf`

## 文件夹说明

1. `01_Logo_Source`：正式矢量 Logo，品牌字形均已转为路径，不依赖用户电脑字体。
2. `02_Exports`：PNG、ICO、矢量 PDF 和预览板。
3. `03_VI_Guidelines`：完整 PDF 规范书和浏览器快速规范。
4. `04_Templates`：名片、信纸、PPT 封面、社交方图和邮件签名 SVG 模板。
5. `05_Brand_Tokens`：开发可直接使用的 JSON / CSS 色彩与字体令牌。
6. `06_Documentation`：说明、字体来源、原创声明与 SHA-256 校验值。

## 核心规则

- 安全留白 X = 方印边长的 1/4。
- 横式标志最小数字宽度 160px；方印最小数字尺寸 20px。
- 日常配色建议：70% 冷纸/白色、20% 深墨/中性色、10% 青玉。
- 不得拉伸、旋转、重排、改色、加阴影、加渐变或重新输入字标。
- 暖金色仅用于烫金、金属、压凹与礼赠等特殊工艺，不作为数字品牌主色。

## 编辑模板

模板中的联系信息和正文是占位内容，可以在 Illustrator、Affinity Designer、Inkscape 或 Figma 中修改。Logo 本体不要重新排字。

## 字体

品牌标题建议 Noto Serif SC（思源宋体），正文建议 Noto Sans SC（思源黑体）。两者采用 SIL Open Font License 1.1。Logo 文件中的字形已转换为矢量轮廓。
"""
    (ROOT / "README_CN.md").write_text(readme, encoding="utf-8")

    fonts = """# 字体来源与许可

## Noto Serif SC / 思源宋体
- 用途：品牌标题、封面、强调性短句
- 来源：https://fonts.google.com/noto/specimen/Noto+Serif+SC
- 许可：SIL Open Font License 1.1

## Noto Sans SC / 思源黑体
- 用途：正文、导航、表格、数据与数字产品
- 来源：https://fonts.google.com/noto/specimen/Noto+Sans+SC
- 许可：SIL Open Font License 1.1

本交付包不重新分发字体软件。Logo SVG 中的品牌字形已转换为矢量路径。
"""
    (DOCS_DIR / "FONT_SOURCES.md").write_text(fonts, encoding="utf-8")

    originality = """# 原创与参考说明

本视觉识别系统为“青意传媒 / QINGYI MEDIA”定制的原创组合：

- 核心形式：青玉色圆角方印 + “青”字 + 中文宋体字标 + 英文疏排辅助字标。
- 图形、比例、色彩和组合均为本项目重新构建，不复制任何参考品牌的 Logo、字体作品或专有视觉资产。

设计方法参考了公开或用户提供的品牌规范在以下通用层面的做法：

1. King’s College London：标志留白、尺寸、色彩可访问性、版式层级和禁用规则。
2. University of Tokyo：VI 架构、主/辅标志、背景控制、品牌方向与配色比例。
3. FIFA World Cup 26：品牌资产分级、网格、办公模板、审批和资产治理结构。
4. McDonald’s 2024 文件：只提炼“一致性、核心资产、留白、配色比例”等通用原则；该资料明确标注内部专有，本项目未复制其 Logo、拱门图形、Speedee 字体、版式或文案。
5. Branding Style Guides Directory：用于了解规范书常见章节覆盖范围，不复制具体品牌资产。

最终商标注册前，建议委托专业商标代理在目标类别进行近似检索。本交付不是法律层面的商标可注册性意见。
"""
    (DOCS_DIR / "ORIGINALITY_AND_REFERENCES.md").write_text(
        originality,
        encoding="utf-8",
    )

    usage = """# Logo 使用简表

| 使用场景 | 推荐文件 |
|---|---|
| 网站页头、合同封面、名片、PPT | QingyiMedia_Logo_Primary_Horizontal.svg |
| 深色或青玉背景 | QingyiMedia_Logo_Primary_Reversed.svg |
| 社交头像、App 图标、聊天按钮 | QingyiMedia_Mark_Jade.svg |
| 单色打印、丝印、压凹 | QingyiMedia_Logo_Monochrome_Black.svg |
| 网站 favicon | QingyiMedia_Favicon.svg / .ico |

安全留白：X = 方印边长的 1/4。  
最小尺寸：横式数字 160px / 印刷 35mm；方印数字 20px / 印刷 6mm。
"""
    (DOCS_DIR / "LOGO_USAGE_QUICK_REFERENCE.md").write_text(
        usage,
        encoding="utf-8",
    )


def write_checksums() -> None:
    rows: list[str] = []
    for path in sorted(ROOT.rglob("*")):
        if path.is_file() and path.name != "SHA256SUMS.txt":
            digest = hashlib.sha256(path.read_bytes()).hexdigest()
            rows.append(f"{digest}  {path.relative_to(ROOT).as_posix()}")
    (DOCS_DIR / "SHA256SUMS.txt").write_text("\n".join(rows) + "\n", encoding="utf-8")


def main() -> None:
    if ROOT.exists():
        shutil.rmtree(ROOT)
    for folder in [
        LOGO_DIR,
        EXPORT_DIR,
        GUIDE_DIR,
        TEMPLATE_DIR,
        TOKENS_DIR,
        DOCS_DIR,
    ]:
        folder.mkdir(parents=True, exist_ok=True)

    assets = create_logo_assets()
    exports = render_exports(assets)
    create_templates()
    render_template_preview()
    create_tokens()
    generate_vi_pdf(exports)
    create_html_guide()
    create_docs()
    write_checksums()

    archive = shutil.make_archive(
        str(ROOT.parent / "qingyi-vi-v1.0"),
        "zip",
        root_dir=ROOT,
    )
    print(f"Created: {ROOT}")
    print(f"Archive: {archive}")
    print(f"Files: {sum(1 for p in ROOT.rglob('*') if p.is_file())}")


if __name__ == "__main__":
    main()
