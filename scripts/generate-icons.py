#!/usr/bin/env python3
# Renders the extension icons: the "G" wordmark glyph from the site's
# SpaceRangerLaserItalic face on the favicon's deep-navy, cropped to a circle.
# Supersampled 4x then downscaled so small sizes stay crisp.
# Usage: python3 scripts/generate-icons.py
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

REPO = Path(__file__).resolve().parent.parent
FONT = REPO.parent / 'galaxy-movies' / 'public' / 'fonts' / 'SpaceRangerLaserItalic-J7an.otf'
OUT = REPO / 'icons'

BG = (0, 30, 46, 255)          # favicon background navy
FG = (255, 255, 255, 255)      # glyph white
RING = (255, 255, 255, 26)     # faint ring so the circle reads on dark toolbars
SS = 4                         # supersample factor


def render(size: int) -> Image.Image:
    s = size * SS
    img = Image.new('RGBA', (s, s), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)

    pad = s // 64  # transparent margin around the circle
    box = (pad, pad, s - pad - 1, s - pad - 1)
    d.ellipse(box, fill=BG)
    d.ellipse(box, outline=RING, width=max(1, s // 64))

    # Fit the glyph inside a square ~58% of the diameter — the italic G is
    # much wider than it is tall, so width is the binding constraint.
    target = (s - 2 * pad) * 0.58
    font_size = s
    for _ in range(40):
        font = ImageFont.truetype(str(FONT), font_size)
        l, t, r, b = font.getbbox('G')
        w, h = r - l, b - t
        if h <= 0 or w <= 0:
            break
        if abs(max(w, h) - target) < 1:
            break
        font_size = max(8, int(font_size * (target / max(w, h))))
    d.text((s / 2 - (l + w / 2), s / 2 - (t + h / 2)), 'G', font=font, fill=FG)

    return img.resize((size, size), Image.LANCZOS)


def main():
    for size in (16, 32, 48, 128):
        render(size).save(OUT / f'{size}.png')
        print(f'icons/{size}.png')


if __name__ == '__main__':
    main()
