# Musim V1 methodology

## Decision question

Given a field location, a current three-season crop sequence, known farm
constraints, and farmer priorities, which alternative rotation is worth
discussing with a local agricultural expert?

Musim compares scenarios; it does not claim to predict yield or prescribe a
crop.

## Environmental profile

The server requests daily NASA POWER data for the last five complete calendar
years at the selected coordinate (the period is computed from today's date):

- `T2M`: mean air temperature at 2 m
- `T2M_MAX`: maximum air temperature at 2 m
- `PRECTOTCORR`: corrected precipitation
- `RH2M`: relative humidity at 2 m
- `ALLSKY_SFC_SW_DWN`: surface solar radiation

Daily values become monthly values for each year (rain is the mean of the valid
days times the days in the month, so a few missing days do not undercount). The
typical year is the mean of each month across the years. A month counts as dry
by the Gaussen test when its rain in mm is below twice its mean temperature in
°C. The interface shows the source, period, grid description (taken from the NASA
response header) and the share of daily values NASA returned.

There is no stand-in climate. If NASA POWER cannot answer, the route returns an
error and the interface says so instead of showing numbers.

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

Nothing in the score is typed in per crop as a rating. Each criterion is
computed from the NASA climate and a short table of crop requirements
(`app/lib/crop-reference.ts`: water need per cycle, temperature range, rain the
crop tolerates on slow-draining soil, nitrogen fixing, botanical family, soil
exposure and equipment).

1. **Seasons.** A plan is three four-month seasons. Season 1 starts at the first
   month of the wettest four-month stretch of the typical year.
2. **Climate fit** for each crop in each season: rain plus the irrigation the
   farmer says is available, against the crop's water need; a drainage penalty
   when the farmer reports slow-draining soil and rain exceeds what the crop
   tolerates; and a temperature fit against the crop's comfortable and failure
   temperatures.
3. **Criteria (0-100).**
   - Water saving: the rain shortfall (mm) the crops would need irrigation to cover.
   - Soil health: crop-family diversity, back-to-back repeats, and whether a legume is present.
   - Income potential: climate fit of the seasons that produce a harvest.
   - Erosion protection: each season's share of peak rainfall times the crop's soil exposure.
   - Nitrogen supply: the share of seasons with a nitrogen-fixing crop.
   - Practicality: how many seasons match today's rotation, and whether the farmer's equipment can run each crop.
4. **Options.** The engine scores all three-season combinations of the supported
   crops and shows the best fit for the farmer's priorities and the best
   one-season change from today's rotation.

```text
sum(criterion score × farmer priority weight)
------------------------------------------------
          sum(farmer priority weights)
```

The score is a comparison aid, not a probability or forecast. The reasons, risks
and evidence on each card are written from these computed numbers.

## Confidence

High confidence needs no information gaps (unknown soil, water, market or
equipment answers, or missing NASA days), no season where the climate fails to
meet a crop, and an option that still beats today's rotation in the driest,
wettest and hottest observed years. Otherwise confidence is Moderate (up to two
gaps) or Low. Every unknown input remains visible as an information gap.

## Sensitivity scenarios

Each scenario re-runs the scoring on a year that NASA actually observed in the
period:

- **Typical:** the average year
- **Driest year:** the year with the least annual rain
- **Wettest year:** the year with the most annual rain
- **Hottest year:** the year with the highest mean temperature

These are observed years, not climate projections.

## What does not come from NASA

NASA POWER cannot say how much water a crop needs, which crops a farmer's
buyers want, or what equipment they own. Those come from the crop requirement
table and the farmer's answers. Both are labelled as such in the interface.

## Required validation before field use

1. Review `crop-reference.ts` with MARDI, the Department of Agriculture, or a
   qualified local agronomist and replace the approximate values with cited ones.
2. Add Malaysian planting windows by region and irrigation scheme.
3. Validate soil compatibility against licensed local soil information.
4. Replace generic income opportunity with user-entered costs and local prices.
5. Test the workflow with farmers and extension officers.
6. Compare satellite indicators with field observations.
