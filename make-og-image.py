#!/usr/bin/env python3
"""
Regenerates og-image.png — the static 1200x630 share image used for the
landing page and non-dog social previews. (Per-dog shares use the dynamic
api/og.tsx generator — different file, same brand language.)

Design rules baked in:
- "The Dog Show" is the ONLY text in Yang Bagus (it's the wordmark).
- Everything else uses a standard sans-serif — DejaVu Sans here because
  it's reliably present on Linux. The visual intent is "clean, neutral,
  readable sans"; swap to a different sans if you prefer.
- Theatre proscenium framing kept from the previous design.

Run: `python3 make-og-image.py` from the repo root. Overwrites og-image.png.
"""
from PIL import Image, ImageDraw, ImageFont
from pathlib import Path

REPO = Path(__file__).parent.resolve()
OUT = REPO / "og-image.png"
YANG = REPO / "YangBagus.ttf"

SANS_BOLD_CANDIDATES = [
    "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf",
    "/usr/local/lib/python3.10/dist-packages/matplotlib/mpl-data/fonts/ttf/DejaVuSans-Bold.ttf",
    "/Library/Fonts/Arial Bold.ttf",
]
SANS_REG_CANDIDATES = [
    "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
    "/usr/local/lib/python3.10/dist-packages/matplotlib/mpl-data/fonts/ttf/DejaVuSans.ttf",
    "/Library/Fonts/Arial.ttf",
]


def pick_font(candidates):
    for p in candidates:
        if Path(p).exists():
            return p
    raise SystemExit(f"No usable font found. Tried: {candidates}")


SANS_BOLD = pick_font(SANS_BOLD_CANDIDATES)
SANS_REG = pick_font(SANS_REG_CANDIDATES)

# ── Brand palette ─────────────────────────────────────────────
BG_TOP     = (15, 10, 34)     # #0f0a22
BG_BOTTOM  = (26, 16, 53)     # #1a1035
ACCENT     = (255, 140, 66)   # #FF8C42 — orange
LAVENDER   = (170, 155, 230)  # tagline color
CURTAIN    = (74, 30, 56)     # #4a1e38 — maroon curtain
CURTAIN_DK = (50, 20, 40)     # darker pleat shadow

W, H = 1200, 630

# ── Canvas + vertical gradient background ─────────────────────
img = Image.new("RGB", (W, H), BG_BOTTOM)
draw = ImageDraw.Draw(img)
for y in range(H):
    t = y / H
    r = int(BG_TOP[0] + (BG_BOTTOM[0] - BG_TOP[0]) * t)
    g = int(BG_TOP[1] + (BG_BOTTOM[1] - BG_TOP[1]) * t)
    b = int(BG_TOP[2] + (BG_BOTTOM[2] - BG_TOP[2]) * t)
    draw.line([(0, y), (W, y)], fill=(r, g, b))

# ── Inner panel border ────────────────────────────────────────
MARGIN = 32
draw.rectangle([MARGIN, MARGIN, W - MARGIN, H - MARGIN],
               outline=(58, 35, 90), width=3)

# ── Top curtain with scalloped bottom edge ────────────────────
CURTAIN_H = 135
ctop = MARGIN + 3
cbot = ctop + CURTAIN_H
draw.rectangle([MARGIN + 3, ctop, W - MARGIN - 3, cbot], fill=CURTAIN)

# vertical pleat lines
for x in range(MARGIN + 16, W - MARGIN - 16, 22):
    draw.line([(x, ctop), (x, cbot)], fill=CURTAIN_DK, width=1)

# scalloped bottom — triangular zigzag
scallop_w = 28
scallop_h = 16
x = MARGIN + 3
while x < W - MARGIN - 3 - scallop_w + 1:
    draw.polygon([(x, cbot),
                  (x + scallop_w / 2, cbot + scallop_h),
                  (x + scallop_w, cbot)], fill=CURTAIN)
    x += scallop_w

# ── "LIVE NOW" badge (sans bold, bordered) ────────────────────
badge_font = ImageFont.truetype(SANS_BOLD, 18)
badge_text = "L I V E   N O W"
bb = draw.textbbox((0, 0), badge_text, font=badge_font)
bw, bh = bb[2] - bb[0], bb[3] - bb[1]
pad_x, pad_y = 22, 10
bx = (W - (bw + pad_x * 2)) // 2
by = cbot + scallop_h + 18
draw.rectangle([bx, by, bx + bw + pad_x * 2, by + bh + pad_y * 2],
               outline=ACCENT, width=2)
draw.text((bx + pad_x - bb[0], by + pad_y - bb[1]),
          badge_text, font=badge_font, fill=ACCENT)

# ── "The Dog Show" wordmark (Yang Bagus, orange) ──────────────
wm_font = ImageFont.truetype(str(YANG), 130)
wm_text = "The Dog Show"
wb = draw.textbbox((0, 0), wm_text, font=wm_font)
ww = wb[2] - wb[0]
wh = wb[3] - wb[1]
wx = (W - ww) // 2 - wb[0]
wy = by + bh + pad_y * 2 + 18
draw.text((wx, wy), wm_text, font=wm_font, fill=ACCENT)

# subtle underline accent under wordmark
ul_y = wy + wh + 12
draw.line([(W // 2 - 80, ul_y), (W // 2 + 80, ul_y)], fill=ACCENT, width=2)

# ── Tagline (DejaVu Sans Bold, lavender) ──────────────────────
tag_font = ImageFont.truetype(SANS_BOLD, 28)
tag_text = "A Live Dog-Viewing Experience"
tb = draw.textbbox((0, 0), tag_text, font=tag_font)
tw_, th_ = tb[2] - tb[0], tb[3] - tb[1]
tx = (W - tw_) // 2 - tb[0]
ty = ul_y + 22
draw.text((tx, ty), tag_text, font=tag_font, fill=LAVENDER)

# ── Bottom footer band ────────────────────────────────────────
FOOTER_H = 52
fbot = H - MARGIN - 3
ftop = fbot - FOOTER_H
draw.rectangle([MARGIN + 3, ftop, W - MARGIN - 3, fbot], fill=CURTAIN)

# "dogshow.lol" centered (DejaVu Sans Bold, orange)
url_font = ImageFont.truetype(SANS_BOLD, 22)
url_text = "dogshow.lol"
ub = draw.textbbox((0, 0), url_text, font=url_font)
uw, uh = ub[2] - ub[0], ub[3] - ub[1]
ux = (W - uw) // 2 - ub[0]
uy = ftop + (FOOTER_H - uh) // 2 - ub[1]
draw.text((ux, uy), url_text, font=url_font, fill=ACCENT)

# two small orange dots flanking the URL
dot_r = 4
left_dot_x = MARGIN + 90
right_dot_x = W - MARGIN - 90
mid_y = ftop + FOOTER_H // 2
draw.ellipse([left_dot_x - dot_r, mid_y - dot_r,
              left_dot_x + dot_r, mid_y + dot_r], fill=ACCENT)
draw.ellipse([right_dot_x - dot_r, mid_y - dot_r,
              right_dot_x + dot_r, mid_y + dot_r], fill=ACCENT)

# ── Save ──────────────────────────────────────────────────────
img.save(OUT, "PNG", optimize=True)
print(f"wrote {OUT} ({OUT.stat().st_size} bytes, {W}x{H})")
