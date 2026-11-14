# ECOSTRESS field-heat data contract

The map shows 70 m land surface temperature (NASA ECOSTRESS, product `ECO_L2T_LSTE`)
for a farm. The browser never reads NASA's files directly: they are large Cloud
Optimized GeoTIFFs and normally need a free Earthdata Login. A processing step
(script or small API) produces **two files per farm**, and the front end only draws them.

## Files

```
public/data/farms/index.json                    list of demo farms
public/data/farms/<farmId>/ecostress.json       metadata for one scene
public/data/farms/<farmId>/ecostress-lst.png    colourised temperature image
```

(If you move these behind an API later, keep the same JSON shapes and change the URLs.)

### index.json
```json
[{ "id": "demo-a", "name": "Demo farm A", "center": [101.18, 3.43], "zoom": 12,
   "scene": "/data/farms/demo-a/ecostress.json" }]
```

### ecostress.json
```json
{
  "isMock": false,
  "product": "ECO_L2T_LSTE v002",
  "farmId": "demo-a",
  "acquired": "2026-11-08T05:12:00Z",
  "bounds": [101.15, 3.40, 101.21, 3.46],
  "image": "/data/farms/demo-a/ecostress-lst.png",
  "minC": 26, "maxC": 44,
  "clearFraction": 0.9,
  "hottest": { "lng": 101.16, "lat": 3.42, "tempC": 44.0 }
}
```
- `bounds` is `[west, south, east, north]` in WGS84 (EPSG:4326). The PNG must cover exactly this box.
- `acquired` is the ISO UTC time of the satellite pass (ECOSTRESS passes are irregular).
- `clearFraction` is the share of usable (clear-sky, non-water) pixels, from 0 to 1.
- `isMock: true` makes the UI show a "sample data" badge. Set it to `false` or omit it for real data.

### ecostress-lst.png
- RGBA PNG, north-up, reprojected to WGS84 so it lines up with `bounds`.
- Colour each pixel with the ramp in `app/lib/ecostress.ts` (`HEAT_RAMP`), mapping `minC` to the first colour and `maxC` to the last.
- **Alpha = 0** for cloud, water and no-data pixels (the map shows blank there).

## How to produce it from the real product
1. Find the ECO_L2T_LSTE granule covering the farm (NASA CMR search, or the `earthaccess` Python package).
2. Read the `LST` layer (Kelvin) and convert to °C (`K - 273.15`).
3. Mask using the separate `cloud` and `water` layers. Do **not** rely on the QC layer for clouds in version 2.
4. Clip to the farm box, colour, write the PNG, write the JSON.
5. Check the product page for known issues (for example, `LST_err` is missing for some scenes from December 2025 to June 2026).

`scripts/make_mock_ecostress.py` generates placeholder files in this exact format. It is a
reference for the file layout, not for the science.
