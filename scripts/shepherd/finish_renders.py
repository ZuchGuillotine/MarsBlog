"""Post-process the Cycles renders: full-quality JPEGs for the site next to the
PNG originals, and a contact sheet. Run after render_shepherd.py.

    python3 scripts/shepherd/finish_renders.py
"""
from __future__ import annotations

from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parents[2]
RENDERS = ROOT / "public/shepherd/renders"
FINAL = [
    "hero-aft-quarter", "hero-aft-high", "hero-beam-and-target", "hero-ram-quarter",
    "hero-anti-sun", "hero-wide", "hero-telescope-close", "exploded", "stowed",
]


def main() -> None:
    done = []
    for name in FINAL:
        png = RENDERS / f"{name}.png"
        if not png.exists():
            print("missing", png.name)
            continue
        im = Image.open(png).convert("RGB")
        im.save(RENDERS / f"{name}.jpg", quality=92, optimize=True, progressive=True)
        done.append(name)
        print(f"{name}: {im.size[0]}x{im.size[1]} -> jpg {(RENDERS / f'{name}.jpg').stat().st_size / 1e6:.2f} MB (png {png.stat().st_size / 1e6:.2f} MB)")
    # contact sheet of the first eight
    sheet_names = [n for n in done if n != "hero-aft-high"][:8]
    if len(sheet_names) >= 4:
        thumbs = [Image.open(RENDERS / f"{n}.jpg").resize((960, 540), Image.LANCZOS) for n in sheet_names]
        cols = 2
        rows = (len(thumbs) + cols - 1) // cols
        sheet = Image.new("RGB", (960 * cols, 540 * rows), (4, 6, 10))
        for i, t in enumerate(thumbs):
            sheet.paste(t, ((i % cols) * 960, (i // cols) * 540))
        sheet.save(RENDERS / "contact-sheet.jpg", quality=88)
        print("contact-sheet.jpg", sheet.size)


if __name__ == "__main__":
    main()
