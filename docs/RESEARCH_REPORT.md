# MUSIM: Field-Scale Rotation Decisions from NASA Earth Data

## Innovation report

### Abstract

Malaysian farmers must choose crop rotations under changing rainfall, heat, soil and market constraints, yet satellite data rarely reaches them as a practical decision. **Musim** is a map-first decision-support tool that lets a farmer draw a field, describe local constraints and priorities, and compare three-season crop rotations. It combines NASA climate and Earth-observation evidence with transparent crop rules; it does not pretend that a satellite can replace a farmer or agronomist. Its central proposition is simple: **NASA sees the environmental context, farmers know the field, and Musim makes the trade-off visible.**

## 1. Introduction

Crop rotation affects water demand, soil condition, erosion exposure, income and resilience. In Malaysia, these decisions are especially sensitive to monsoon timing, intense rain, prolonged wetness and increasingly hot periods. Existing agricultural portals are valuable for records, commerce or general advice, but farmers still lack a simple way to ask: *What could I plant next, why might it fit this field, and what should I confirm locally?*

Musim addresses NASA Space Apps' **Field Shift: Adapting Farms with NASA Data** challenge by turning NASA observations into an explainable comparison rather than a generic weather dashboard. The project has three objectives:

1. Translate recent climate patterns into understandable growing and stress periods.
2. Rank practical rotations using the farmer's constraints and priorities.
3. Expose evidence, uncertainty and information gaps so every recommendation can be challenged.

Musim supports—not replaces—local expertise. Its intended users are farmers, extension officers, cooperatives and agricultural planners.

## 2. Methodology

### 2.1 User-centred workflow

The application opens on a full-screen map. The user searches for a location, drops a pin or draws a field boundary. A short wizard records the current crop sequence, known soil information, irrigation, equipment, market access and desired outcomes such as saving water or reducing erosion. All questions are optional; skipped answers become visible information gaps rather than hidden assumptions.

The results retain the map and provide two views:

- **Conditions:** seasonal rainfall and temperature, stress periods and dated NASA map layers.
- **Rotations:** the current practice and two alternatives, with scores, reasons, NASA evidence, risks, confidence and items to confirm with a local expert.

Users can test an observed drier, wetter or hotter year, edit their answers, and export an expert-ready summary.

### 2.2 Data and processing

| Resource | Use in Musim | Important interpretation |
|---|---|---|
| NASA POWER Daily API | Rainfall, air temperature, humidity and solar context | Regional climate evidence at the field's centre, not a field sensor |
| NASA GIBS | Dated SMAP soil-moisture, MODIS land-surface-temperature and imagery layers | Visual environmental context; SMAP is coarse and MODIS surface heat is not air temperature |
| Farmer inputs | Irrigation, equipment, market access, soil knowledge and priorities | Local evidence that satellites cannot observe |
| Crop reference rules | Water, temperature, drainage and rotation requirements | Transparent prototype rules, not NASA data or agronomic certification |

For the selected coordinate, Musim requests the last five complete calendar years from NASA POWER. Daily values are aggregated into monthly values, then averaged into a typical twelve-month profile. Rainfall availability is compared with crop water needs, while temperature and drainage tolerances provide suitability checks. A Gaussen-style test flags months where rainfall is less than twice mean temperature; data coverage is shown to the user.

The engine evaluates possible three-season sequences. Each option receives interpretable scores for water saving, soil health, income potential, erosion protection, nitrogen contribution and practicality. The farmer's ranked priorities become the weights in the final score. Musim presents both the strongest overall alternative and a low-disruption option that changes only one season.

Confidence is reduced when inputs are missing, climate data are incomplete, a crop fails a climate check, or a result changes strongly between the observed dry, wet and hot years. The optional AI explanation layer cannot invent the numerical recommendation: the server re-fetches NASA data, re-runs the deterministic rules, and gives the model only the resulting evidence to explain.

### 2.3 Responsible design

Musim does not silently substitute simulated climate data when NASA POWER is unavailable. It reports the failure. Recommendations always include risks and a prompt to confirm crop timing, drainage, seed availability and prices locally. This design makes uncertainty part of the product instead of hiding it behind a single score.

## 3. Results

### 3.1 Working prototype

The prototype successfully demonstrates the complete decision loop: select a real field, retrieve NASA climate data, view dated Earth-observation layers, enter farm constraints, compare rotations, stress-test the ranking and produce a shareable summary. A separate 90-day Crop Check also turns recent POWER observations into concise watch items without changing the rotation model.

The current results are an **engineering and decision-logic validation**, not evidence that a recommended rotation has already improved farm yield or income. Field trials and expert review remain necessary.

### 3.2 Kedah paddy demonstration

A live prototype request was tested at **6.10° N, 100.40° E**, near Alor Setar, using complete NASA POWER records from **2021–2025**.

| Finding | Prototype result | Decision value |
|---|---:|---|
| Typical annual rainfall | 2,613 mm | Shows that annual totals alone can hide timing risk |
| Wettest typical month | November, 536 mm | Highlights drainage and field-access concerns |
| Wettest four-month window | August–November, 1,336 mm | About 51% of typical annual rain falls in this window |
| Observed driest year | 2021, 2,314 mm | Used for a real dry-year stress test |
| Observed wettest year | 2022, 3,004 mm | Tests drainage-sensitive options |
| Observed hottest year | 2024, mean 27.1°C | Tests heat sensitivity without claiming a future forecast |

This case demonstrates why Musim uses seasonal windows rather than a single annual climate label. It also shows the value of comparing options across years that actually occurred. The figures are regional POWER evidence for the chosen coordinate; they are not claimed as measurements inside every parcel.

## 4. Discussion

Musim's originality is not another map or chatbot. It is the connection between four elements that are usually separated: a user-drawn field, traceable NASA evidence, farmer-defined priorities and an explainable rotation comparison. A conventional suitability map asks *what can grow here?* Musim asks the more actionable question: *what change is worth discussing next, given this farmer's reality?*

The approach is practical because it works in a browser, accepts incomplete knowledge and produces an expert checklist. It can scale as a free farmer tool, an extension-officer dashboard, or a cooperative service that saves and compares multiple fields. The same transparent engine can later support local language, district crop calendars and institution-approved crop rules.

Important limitations remain. POWER and SMAP are too coarse to diagnose conditions within a small field. Satellite soil moisture and surface temperature need local interpretation, clouds and retrieval gaps can affect imagery, and current crop rules require validation by Malaysian agronomists. Income scores are relative indicators rather than live price forecasts. No causal yield or revenue benefit is claimed.

The next research phase should compare Musim outputs with station and farm observations, conduct structured reviews with farmers and extension officers, and measure whether users understand the evidence and make better-informed discussions. NASA GPM rainfall, SRTM terrain, AppEEARS-derived vegetation products and FAO GAEZ suitability can then be added only after their scale and uncertainty are communicated correctly.

## 5. Conclusion

Musim demonstrates a credible path from open space data to a Malaysian farm decision. It uses real NASA observations, keeps its scoring inspectable, adapts to the farmer's priorities and states what still needs human review. The result is not an automated farming verdict; it is a defensible conversation starter that helps farmers and experts compare water, soil, erosion and livelihood trade-offs before committing a season.

With local validation, Musim can make NASA data useful at the moment that matters most: when a farmer is deciding what to do next.

## 6. References

1. NASA International Space Apps Challenge. [Field Shift: Adapting Farms with NASA Data](https://www.spaceappschallenge.org/2026/challenges/field-shift-adapting-farms-with-nasa-data/).
2. NASA Langley Research Center. [POWER Daily API](https://power.larc.nasa.gov/docs/services/api/temporal/daily/).
3. NASA Langley Research Center. [POWER agricultural community and parameters](https://power.larc.nasa.gov/docs/methodology/communities/).
4. NASA Global Imagery Browse Services. [Available visualizations](https://nasa-gibs.github.io/gibs-api-docs/available-visualizations/).
5. NASA Global Precipitation Measurement. [IMERG precipitation data](https://gpm.nasa.gov/data/imerg).
6. NASA LP DAAC. [AppEEARS API](https://appeears.earthdatacloud.nasa.gov/api/).
7. NASA Earthdata. [Shuttle Radar Topography Mission (SRTM)](https://www.earthdata.nasa.gov/data/instruments/srtm).
8. Food and Agriculture Organization. [Global Agro-Ecological Zones](https://gaez.fao.org/).

