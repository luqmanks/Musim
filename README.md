# Musim — Field Shift Malaysia

Musim is a map-first decision-support prototype for the 2026 NASA Space Apps
Challenge, **Field Shift: Adapting Farms with NASA Data**. It helps Malaysian
farmers rehearse possible crop rotations before committing the next season.

The tool combines a farm location, optional local field details, farmer
priorities, and NASA Earth observations. It compares the current rotation with
a conservative alternative and a resilience-focused alternative. Every result
shows its evidence, assumptions, risks, information gaps, and confidence.

> Musim supports a conversation with a local agricultural expert. It is not a
> prescription, yield forecast, or substitute for field measurements.

## V1 experience

1. Draw a field boundary, place one point, or open a Malaysian demo farm.
2. Describe the current crop sequence, soil, water, equipment, and market.
3. Weight water, soil health, income, erosion, nitrogen, and practicality.
4. Review a 2021–2025 climate profile and dated NASA map evidence.
5. Compare three rotations under typical, drier, wetter, and +1 °C sensitivity
   scenarios.
6. Print an expert-handoff summary with risks and unanswered questions.

## NASA resources

| Resource | V1 use | Important limitation |
| --- | --- | --- |
| [NASA POWER Daily API](https://power.larc.nasa.gov/docs/services/api/temporal/daily/) | Live five-year rainfall, temperature, humidity, and solar profile | Regional grid context, not an on-field weather station |
| [NASA SMAP via EOSDIS GIBS](https://gibs.earthdata.nasa.gov/) | Latest available regional surface-soil-moisture map | About 9 km per pixel; not a field sensor |
| NASA MODIS via EOSDIS GIBS | Latest available true-colour and daytime land-surface-temperature context | Near-real-time rather than instantaneous; cloud cover and coarse resolution can leave gaps |

Musim reads the current default date for every GIBS layer from NASA's live WMTS
capability feed and displays that date in the interface. It does not describe
satellite imagery as a real-time field sensor.

## Product position

Musim's selling point is not another farm record system or satellite dashboard.
It is an **explainable rotation rehearsal**: NASA shows what is happening around
the field, the farmer adds what a satellite cannot know, and the tool turns both
into comparable three-season options. Every option exposes evidence, trade-offs,
risks, missing information, and confidence, then produces questions for a local
expert.

The POWER route returns a clearly marked demonstration climatology if the live
service cannot respond. Fallback data lowers recommendation confidence.

## Run locally

Requirements: Node.js and npm.

```powershell
npm.cmd install
npm.cmd run dev
```

Open [http://localhost:3000](http://localhost:3000).

Validation:

```powershell
npm.cmd run lint
npm.cmd run build
```

## Crop check & AI advisor (NASA POWER daily point)

The results step adds a **Crop check** tab. It loads the last 90 days for the chosen field from the
NASA POWER **daily single-point API**, checks each crop against rule-of-thumb stress thresholds, and
offers a Gemini advisor. All POWER requests (this tab and the five-year climate profile behind
`/api/nasa/power`) go through the same client in `app/lib/power.ts`:

```
GET https://power.larc.nasa.gov/api/temporal/daily/point
    ?parameters=T2M,T2M_MAX,T2M_MIN,PRECTOTCORR,RH2M,WS2M,ALLSKY_SFC_SW_DWN,GWETROOT,GWETTOP
    &community=AG&longitude=<lng>&latitude=<lat>&start=YYYYMMDD&end=YYYYMMDD&format=JSON
```

- CORS is open and no API key is needed, so the browser calls it directly for the 90-day check.
- `-999` is the fill value. The newest 2–4 days are usually still `-999` (solar radiation lags longest),
  so every KPI and alert shows the date its data runs to.
- The grid is about 0.5° (~50 km), so the values describe the surrounding area, not a single field.
- Crop alerts (`app/lib/cropRules.ts`) are rule-of-thumb checks for dry spells, 30-day rain, root-zone
  drought and waterlogging, heavy rain, heat, disease weather, low sunlight, wind and rubber tapping days.
  Thresholds are set per crop (oil palm, padi, durian/fruit, rubber, cocoa, banana, leafy vegetables,
  generic). They look back at past weather. POWER has no forecast, and the alerts are not agronomic advice.

### AI field advisor (Gemini on Vertex AI)

The "Analyse this field" button calls `POST /api/advisor` (`app/api/advisor/route.ts`). The server
re-fetches the NASA POWER data, re-runs the crop rules, and streams a Gemini analysis through the
Vercel AI SDK (`ai` + `@ai-sdk/google-vertex`, express mode with an API key). The browser sends only
`{ lat, lng, cropId, question?, profile? }`, where `profile` is the farm-details answers checked
against an allow-list. The key and the prompt (`app/lib/advisor.ts`) stay on the server.

`.env` (git-ignored):

```
GEMINI_API_KEY=<Vertex AI express-mode API key>
# optional, default gemini-3.8-flash
GEMINI_MODEL=gemini-3.8-flash
```

## Architecture

- Next.js 16 App Router and React 19
- MapLibre GL with OpenStreetMap basemap
- NASA GIBS raster overlays
- Server-side `/api/nasa/power` proxy and monthly aggregation (fetches through `app/lib/power.ts`)
- Rule-based crop check (`app/lib/cropRules.ts`) and a Gemini advisor (`/api/advisor`, Vercel AI SDK)
- Deterministic, priority-weighted rotation engine
- Local fonts and responsive CSS; no external UI framework

The crop-trait values in V1 are transparent prototype assumptions. They must be
reviewed with Malaysian agronomists and replaced with cited local crop calendars,
soil constraints, costs, and market evidence before operational use. See
[`docs/METHODOLOGY.md`](docs/METHODOLOGY.md).

## Team standards

- Never present regional satellite data as a precise field measurement.
- Label synthetic or demonstration data visibly.
- Cite every dataset, asset, and agronomic rule.
- Prefer explainable calculations over unsupported AI claims.
- Preserve missing information as a gap; never silently invent it.
