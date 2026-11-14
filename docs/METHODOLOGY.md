# Musim V1 methodology

## Decision question

Given a field location, a current three-season crop sequence, known farm
constraints, and farmer priorities, which alternative rotation is worth
discussing with a local agricultural expert?

Musim compares scenarios; it does not claim to predict yield or prescribe a
crop.

## Environmental profile

The server requests daily NASA POWER data for 2021–2025 at the selected
coordinate:

- `T2M`: mean air temperature at 2 m
- `T2M_MAX`: maximum air temperature at 2 m
- `PRECTOTCORR`: corrected precipitation
- `RH2M`: relative humidity at 2 m
- `ALLSKY_SFC_SW_DWN`: surface solar radiation

Daily observations are aggregated into a typical month across the five-year
period. Annual rainfall is the sum of those 12 typical months. The interface
retains the source, date range, spatial resolution, and fallback status.

NASA SMAP soil-moisture imagery and MODIS daytime land-surface temperature are
displayed through NASA EOSDIS GIBS. The server reads each layer's current
default date from the live GIBS WMTS capability document. The interface shows
that acquisition date and calls the imagery near-real-time, not instantaneous.

SMAP is regional context at approximately 9 km resolution and is never
described as a measurement taken inside the selected field. MODIS surface heat
is land-surface temperature rather than air temperature; cloud cover may leave
gaps.

When a user draws a boundary, V1 calculates its centre and approximate area in
hectares. POWER is still requested for the centre coordinate, while the full
boundary remains visible over the imagery. Area-weighted environmental
aggregation is a planned validation step, not a current claim.

## Rotation score

V1 assigns transparent prototype trait values to each supported crop for water
resilience, soil health, income opportunity, erosion protection, nitrogen, and
practicality. The engine averages crop traits and applies documented adjustments
for diversity, repetition, legumes, fallow, water, markets, climate, and the
selected sensitivity scenario.

```text
sum(criterion score × farmer priority weight)
------------------------------------------------
          sum(farmer priority weights)
```

The score is a comparison aid, not a probability or forecast.

## Confidence

Confidence begins with environmental-data quality and changes according to live
NASA POWER success, known soil, water reliability, market access, and the added
uncertainty of an alternative practice. Every unknown input remains visible as
an information gap.

## Sensitivity scenarios

- **Typical:** observed 2021–2025 profile
- **Drier:** qualitative sensitivity test for lower water availability
- **Wetter:** qualitative sensitivity test for stronger rainfall pressure
- **+1 °C:** qualitative heat sensitivity test

These controls are not climate projections. The interface labels them as
sensitivity tests.

## Required validation before field use

1. Review crop traits with MARDI, the Department of Agriculture, or a qualified
   local agronomist.
2. Add Malaysian planting windows by region and irrigation scheme.
3. Validate soil compatibility against licensed local soil information.
4. Replace generic income opportunity with user-entered costs and local prices.
5. Test the workflow with farmers and extension officers.
6. Compare satellite indicators with field observations.

