# Space Apps submission draft

Replace bracketed team information and re-check the final event form before
submitting.

## High-level summary

Musim is a Malaysia-first crop-rotation rehearsal tool. A farmer selects a
field, describes what they know about the farm, and ranks priorities such as
water, soil health, income, erosion, nitrogen, and practicality. Musim combines
those choices with NASA Earth observations to compare the current crop sequence
with two alternatives.

Instead of presenting a black-box recommendation, Musim explains every score.
It shows which NASA observations support the comparison, which assumptions were
made, which risks require local review, what information is missing, and how
confident the tool can be. Farmers can also stress-test rotations under drier,
wetter, and hotter sensitivity scenarios and print an expert-handoff checklist.

Malaysia's farmers face changing rainfall, heat, water constraints, and soil
pressure. Musim makes NASA's regional environmental perspective understandable
at the moment a farmer is considering the next season. It supports—not
replaces—local agricultural expertise.

## What we developed

- A responsive, map-first Next.js application
- User-drawn field boundaries with an approximate hectare area
- Live five-year NASA POWER climate aggregation for any selected coordinate
- NASA SMAP, MODIS true-colour, and MODIS surface-temperature map layers through
  EOSDIS GIBS, using NASA's live capability feed for the latest available dates
- An explainable, farmer-priority-weighted rotation comparison engine
- Climate sensitivity controls, uncertainty, evidence, and information gaps
- A printable expert-handoff summary

## How it addresses Field Shift

The project's central task is comparing multi-season crop rotations. NASA Earth
observations provide the environmental context; local farm answers describe soil
and constraints; crop traits describe possible sequences; and farmer priorities
become explicit model weights. The output is a set of understandable options,
not a generic satellite dashboard or a single-crop recommendation.

## Use of NASA resources

1. **NASA POWER Daily API** — rainfall, temperature, humidity, and solar
   radiation for the selected coordinate, aggregated across 2021–2025.
2. **NASA SMAP through EOSDIS GIBS** — regional daily surface-soil-moisture
   context at approximately 9 km resolution.
3. **NASA MODIS through EOSDIS GIBS** — true-colour imagery and daytime land
   surface temperature, with the latest available NASA date shown in the app.

## User flow

1. Draw the field boundary for the strongest field-level context, or place one
   point for a quick regional estimate.
2. Add optional farm knowledge: crop sequence, soil, water, equipment, and
   market access. Unknown answers remain visible information gaps.
3. Set priorities for water, soil health, income, erosion, nitrogen, and
   practicality.
4. Read the field brief: the five-year POWER profile plus switchable, dated
   MODIS heat, SMAP soil moisture, and true-colour map evidence.
5. Compare the current rotation with two alternatives and stress-test them
   under drier, wetter, and hotter assumptions.
6. Save an expert handoff containing the evidence, risks, and questions that
   still require local review.

## Selling point

Musim is an explainable decision rehearsal, not a prescription and not a farm
management clone. NASA contributes the environmental view; the farmer
contributes the constraints NASA cannot see. Musim makes the trade-off between
those inputs visible across the next three seasons, then turns uncertainty into
an actionable checklist for a Malaysian agricultural officer.

## Limitations

- Satellite and reanalysis products provide regional context, not direct field
  measurements.
- V1 crop-trait scores are transparent prototype assumptions that require local
  agronomic review.
- Income is an opportunity indicator, not a profit forecast.
- Sensitivity controls are not climate projections.
- Recommendations must be checked against local planting calendars, drainage,
  seed availability, equipment, buyers, and prices.

## Use of artificial intelligence

OpenAI Codex assisted with software implementation, design review, documentation,
and code validation. The team selected the product direction, supplied the
challenge and local context, reviewed outputs, and remains responsible for all
claims, sources, code, and submission materials. Musim's runtime rotation engine
is deterministic and explainable; it does not use a generative AI model to issue
farm recommendations.

## 30-second demo script

**0:00–0:04** — “Malaysia's next planting decision starts here—with the field.”

**0:04–0:09** — Draw a field boundary and switch on Surface heat. “Musim reads
five years of NASA climate data and the latest available satellite heat.”

**0:09–0:15** — Show farm questions and priorities. “The farmer adds what a
satellite cannot know: soil, water, equipment, markets, and personal goals.”

**0:15–0:24** — Reveal the rotation cards and change to the drier scenario.
“Musim compares three seasons, explains every score, and shows risks, evidence,
gaps, and confidence.”

**0:24–0:30** — Open the expert handoff. “It does not replace local expertise.
It turns NASA observations into a better conversation before the next season.”

## Seven-slide outline

1. **The farmer's next three seasons** — Team, challenge, one-line promise
2. **Why Malaysia needs resilient planting choices** — Local problem and user
3. **From orbit to field conversation** — NASA data and farmer-input pipeline
4. **The Musim experience** — Map, wizard, conditions, rotations
5. **Explainable by design** — Score, evidence, gaps, risk, confidence
6. **Built for reality** — Limitations, expert handoff, validation plan
7. **From Kedah prototype to Malaysian platform** — Impact and scale

## References

- NASA POWER Daily API: https://power.larc.nasa.gov/docs/services/api/temporal/daily/
- NASA EOSDIS GIBS: https://gibs.earthdata.nasa.gov/
- NASA GPM IMERG: https://gpm.nasa.gov/data/imerg
- Malaysia Department of Agriculture GeoTanih:
  https://epengembangan.doa.gov.my/perkhidmatan/khidmat-teknikal-ms/geotanih/
- Department of Statistics Malaysia, Supply and Utilization Accounts:
  https://www.dosm.gov.my/portal-main/release-content/supply-and-utilization-accounts-selected-agricultural-commodities-malaysia-2025

