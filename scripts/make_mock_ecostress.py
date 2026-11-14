"""Generate MOCK ECOSTRESS-style field-heat data for the front end (not real satellite data).

Writes public/data/farms/index.json and, per farm, ecostress.json + ecostress-lst.png.
The real pipeline should produce files in exactly the same shape (see
docs/ecostress-data-contract.md): read the LST band (Kelvin) of ECO_L2T_LSTE, mask the
`cloud` and `water` layers, convert to Celsius, colour with HEAT_RAMP, write an RGBA PNG.

Run:  python3 scripts/make_mock_ecostress.py     (needs numpy and pillow)
"""
import json
from pathlib import Path

import numpy as np
from PIL import Image

RAMP = ["#3b4cc0", "#7aa0f8", "#f2d85a", "#f08a3c", "#c8201f"]  # keep in sync with app/lib/ecostress.ts
OUT = Path("public/data/farms")
SIZE = 96          # pixels per side (~70 m each, so ~6.7 km)
HALF_DEG = 0.03    # half the width of the area in degrees

FARMS = [
    {"id": "demo-a", "name": "Demo farm A (sample)", "center": [101.18, 3.43], "seed": 7,
     "acquired": "2026-11-08T05:12:00Z", "min": 26, "max": 44},
    {"id": "demo-b", "name": "Demo farm B (sample)", "center": [100.40, 6.10], "seed": 21,
     "acquired": "2026-11-05T04:48:00Z", "min": 25, "max": 42},
]


def hex_rgb(h):
    return np.array([int(h[i:i + 2], 16) for i in (1, 3, 5)], dtype=float)


def colourise(t01):
    stops = np.linspace(0, 1, len(RAMP))
    cols = np.stack([hex_rgb(c) for c in RAMP])
    return np.stack([np.interp(t01, stops, cols[:, k]) for k in range(3)], axis=-1)


def smooth(a, k=5):
    for _ in range(3):
        a = (np.roll(a, 1, 0) + np.roll(a, -1, 0) + np.roll(a, 1, 1) + np.roll(a, -1, 1) + a) / 5
    return a


for farm in FARMS:
    rng = np.random.default_rng(farm["seed"])
    lo, hi = farm["min"], farm["max"]
    # base temperature plus field-shaped blocks (bare fields hot, irrigated/planted cool)
    temp = np.full((SIZE, SIZE), lo + 0.45 * (hi - lo))
    for _ in range(14):
        y, x = rng.integers(0, SIZE - 20, 2)
        h, w = rng.integers(10, 26, 2)
        temp[y:y + h, x:x + w] += rng.uniform(-0.3, 0.45) * (hi - lo)
    temp += smooth(rng.normal(0, 1.2, (SIZE, SIZE)))
    temp = np.clip(temp, lo, hi)

    # cloud / no-data holes (transparent in the PNG)
    yy, xx = np.mgrid[0:SIZE, 0:SIZE]
    valid = np.ones((SIZE, SIZE), bool)
    for _ in range(3):
        cy, cx, r = rng.integers(10, SIZE - 10), rng.integers(10, SIZE - 10), rng.integers(6, 12)
        valid &= (yy - cy) ** 2 + (xx - cx) ** 2 > r ** 2

    rgb = colourise((temp - lo) / (hi - lo))
    img = np.dstack([rgb, np.where(valid, 255, 0)]).astype(np.uint8)

    d = OUT / farm["id"]
    d.mkdir(parents=True, exist_ok=True)
    Image.fromarray(img, "RGBA").save(d / "ecostress-lst.png")

    lng, lat = farm["center"]
    w, s, e, n = lng - HALF_DEG, lat - HALF_DEG, lng + HALF_DEG, lat + HALF_DEG
    masked = np.where(valid, temp, -np.inf)
    iy, ix = np.unravel_index(np.argmax(masked), masked.shape)
    scene = {
        "isMock": True,
        "product": "ECO_L2T_LSTE v002",
        "farmId": farm["id"],
        "acquired": farm["acquired"],
        "bounds": [round(w, 5), round(s, 5), round(e, 5), round(n, 5)],
        "image": f"/data/farms/{farm['id']}/ecostress-lst.png",
        "minC": lo,
        "maxC": hi,
        "clearFraction": round(float(valid.mean()), 2),
        "hottest": {
            "lng": round(w + (ix + 0.5) / SIZE * (e - w), 5),
            "lat": round(n - (iy + 0.5) / SIZE * (n - s), 5),
            "tempC": round(float(temp[iy, ix]), 1),
        },
    }
    (d / "ecostress.json").write_text(json.dumps(scene, indent=2) + "\n")

index = [{"id": f["id"], "name": f["name"], "center": f["center"], "zoom": 12,
          "scene": f"/data/farms/{f['id']}/ecostress.json"} for f in FARMS]
(OUT / "index.json").write_text(json.dumps(index, indent=2) + "\n")
print("wrote", OUT)
