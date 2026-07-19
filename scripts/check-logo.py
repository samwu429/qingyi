from pathlib import Path

t = Path(
    r"C:\Users\wu200\Desktop\qingyi\01_Logo_Source\QingyiMedia_Logo_Primary_Horizontal.svg"
).read_text(encoding="utf-8")
assert 'fill="none"' in t and 'stroke="#689078"' in t
assert "#282828" in t
assert 'fill="#0C8A6B"' not in t
print("primary outline OK")
print("sage occurrences", t.count("#689078"))
print("ink occurrences", t.count("#282828"))
print([l for l in t.splitlines() if "viewBox" in l][0])

# Also try rendering with Pillow + pure python if possible via resvg/skia
try:
    import subprocess
    import shutil

    for cmd in ("resvg", "inkscape", "magick"):
        if shutil.which(cmd):
            print("found", cmd)
except Exception as e:
    print(e)
