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

1. Select a Malaysian field by pin or demo farm.
2. Describe the current crop sequence, soil, water, equipment, and market.
3. Weight water, soil health, income, erosion, nitrogen, and practicality.
4. Review a 2021–2025 climate profile and NASA map evidence.
5. Compare three rotations under typical, drier, wetter, and +1 °C sensitivity
   scenarios.
6. Print an expert-handoff summary with risks and unanswered questions.

## NASA resources

| Resource | V1 use | Important limitation |
| --- | --- | --- |
| [NASA POWER Daily API](https://power.larc.nasa.gov/docs/services/api/temporal/daily/) | Live five-year rainfall, temperature, humidity, and solar profile | Regional grid context, not an on-field weather station |
| [NASA SMAP via EOSDIS GIBS](https://gibs.earthdata.nasa.gov/) | Daily regional surface-soil-moisture map | About 9 km per pixel; not a field sensor |
| NASA MODIS via EOSDIS GIBS | True-colour and land-surface-temperature context | Cloud cover and coarse resolution can leave gaps |
| NASA ECOSTRESS | Data contract and demo heat overlay | Current bundled farm scenes are explicitly labelled samples, not live readings |

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

## Architecture

- Next.js 16 App Router and React 19
- MapLibre GL with OpenStreetMap basemap
- NASA GIBS raster overlays
- Server-side `/api/nasa/power` proxy and monthly aggregation
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
