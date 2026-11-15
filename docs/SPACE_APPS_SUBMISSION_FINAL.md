# MUSIM — Space Apps submission copy

Paste the entries below into the matching fields. Replace only the clearly marked demo placeholder and verify the team declaration personally before submission.

## Project Name

**MUSIM: Field Shift Malaysia**

Optional tagline for slides and video:

**Know the season. Rehearse the rotation. Confirm it locally.**

## Summary

Musim is a map-first decision-support tool that helps Malaysian farmers rehearse crop rotations before committing the next season. A farmer draws a field, adds what satellites cannot know—such as irrigation, equipment, soil knowledge and market access—and ranks priorities including water, soil health, income and erosion.

Musim combines these answers with five years of NASA POWER climate data and dated SMAP and MODIS map layers from NASA EOSDIS GIBS. Its transparent engine compares the current three-season rotation with a low-disruption option and a resilience-focused alternative. Each result explains its score, NASA evidence, trade-offs, risks, missing information and confidence. Farmers can also test rotations against observed drier, wetter and hotter years and review a recent 90-day crop-stress check.

Musim does not replace local expertise or claim field-level satellite precision. It turns regional NASA observations into a practical, expert-ready conversation about what to plant next and what must still be checked locally.

**Length:** 149 words and 1,046 characters; within the form's suggested 50–200 words and 1,500-character limit.

## Project Demonstration

This field must contain **one public link** to either a video of 30 seconds or less or a presentation of no more than seven slides. It must not require a login, permission request or password.

**Paste after uploading the demo:**

`[PUBLIC YOUTUBE, GOOGLE DRIVE, OR SEVEN-SLIDE PRESENTATION URL]`

Do not paste the live application here; the form asks for a short video or slide presentation. Test the finished link in an incognito window.

### Recommended 30-second narration

> Malaysia's next planting decision starts with the field. Musim combines NASA climate and satellite observations with what only the farmer knows: soil, water, equipment, markets and priorities. Draw a field, reveal recent conditions, then compare the current three-season rotation with practical alternatives. Every option explains its evidence, trade-offs, risks, gaps and confidence—and can be tested against observed dry, wet and hot years. Musim does not replace local expertise. It turns NASA data into a better conversation before the next season.

### Recording sequence

1. **0:00–0:04:** Draw or select the Kedah demo field.
2. **0:04–0:09:** Enable the Surface heat or Soil moisture NASA layer.
3. **0:09–0:14:** Show the farm questions and farmer priorities.
4. **0:14–0:24:** Reveal the three rotation cards and switch the observed-year scenario.
5. **0:24–0:30:** Show the risks, evidence and expert-handoff message.

## Final Project

**Link Text:** MUSIM — Live Application

**Link URL:** https://musim-beta.vercel.app/field

Verified as publicly reachable without a login on 15 November 2026.

## Source Code

**Link Text:** MUSIM — GitHub Source Code

**Link URL:** https://github.com/luqmanks/Musim

## Project Details

### What Musim does

Musim is an explainable crop-rotation rehearsal for Malaysian farmers and agricultural officers. The experience begins on a full-screen map: a user searches for a farm, drops a point or draws its boundary. The user can then describe the current three-season crop sequence, known soil conditions, water access, equipment and market constraints. Unknown answers are preserved as information gaps instead of being silently invented.

The farmer ranks priorities such as saving water, improving soil health, protecting income, reducing erosion, contributing nitrogen and remaining practical. Musim retrieves the last five complete years of daily NASA POWER observations for the field's centre and converts them into understandable monthly rainfall, temperature, humidity and solar patterns. Dated NASA SMAP soil-moisture, MODIS land-surface-temperature and MODIS true-colour layers are displayed through EOSDIS GIBS.

### How the decision engine works

The deterministic engine compares crop water, temperature, drainage and rotation requirements against the NASA-derived seasonal profile. It evaluates possible three-season sequences and weights water, soil, income, erosion, nitrogen and practicality using the farmer's priorities. The results show the current practice, a low-disruption alternative and a resilience-focused alternative.

Every card explains why it was suggested, which NASA evidence supports it, what could go wrong, which information is missing and why its confidence is high, moderate or low. The user can re-score the rotations using the driest, wettest and hottest years actually observed in the five-year POWER record. These are sensitivity tests, not weather or climate forecasts. A separate Crop Check uses the latest available 90 days of POWER data and transparent crop thresholds to flag recent heat, rainfall, moisture and disease-weather concerns.

### Benefits and intended impact

Satellite dashboards often stop at showing data, while farm software often assumes the farmer already knows the answer. Musim connects the two. NASA contributes regional environmental context; the farmer contributes constraints satellites cannot observe. The output is not an automated instruction but a traceable comparison and an expert-ready checklist.

The first use case is a Kedah paddy demonstration, with a path toward other Malaysian crops and districts. With validation by farmers and agronomists, Musim could support extension officers, cooperatives and planning agencies by making rotation trade-offs faster to discuss and easier to document.

### Technology and construction

Musim is built with TypeScript, Next.js 16, React 19 and MapLibre GL. OpenStreetMap provides the basemap. Server routes retrieve and aggregate NASA POWER data and read current imagery dates from the NASA GIBS capability feed. The rotation model and crop checks are deterministic TypeScript rules. An optional Gemini advisor on Google Vertex AI explains the server-verified NASA data and rule outputs; it does not create the underlying scores. The application is deployed publicly on Vercel, and the complete source and methodology are available on GitHub.

### Limits considered

POWER, SMAP and MODIS provide regional context rather than direct measurements inside a small field. Surface temperature is not air temperature, imagery may contain gaps, crop requirements are prototype assumptions requiring Malaysian agronomic review, and income is a relative opportunity indicator rather than a profit forecast. Musim displays these limits and asks users to confirm drainage, soil, seed, prices and crop timing with a local expert before acting.

## Use of Super Intelligence (SI)

### Options to select

Select every dropdown option equivalent to:

- Large language model, chatbot or text generation
- Code generation or programming assistance
- Data analysis/research assistance, if offered

Do **not** select AI-generated images, video or audio unless the final submitted demo actually includes them. Product screenshots recorded from Musim are not AI-generated images.

### Disclosure text

OpenAI Codex was used during development to assist with code generation and refactoring, UI/UX iteration, debugging, research synthesis and draft documentation. Google Gemini on Vertex AI is also used inside Musim as an optional explanation interface. The server re-fetches NASA POWER data and re-runs deterministic crop rules before passing evidence to Gemini; Gemini does not calculate rotation scores or issue an authoritative farming recommendation.

The team selected the problem, product direction, architecture, decision rules, data sources and final claims, and reviewed and edited all AI-assisted outputs. The runtime discloses that Gemini output can be wrong and requires serious actions to be confirmed locally. No AI-generated NASA logo, mission identifier or branding is used.

## NASA Data

Add each of these as a separate link.

| Link Text | Link URL | Use in Musim |
|---|---|---|
| NASA POWER Daily API | https://power.larc.nasa.gov/docs/services/api/temporal/daily/ | Five-year climate profile and recent 90-day crop checks |
| NASA EOSDIS GIBS | https://nasa-gibs.github.io/gibs-api-docs/access-basics/ | Dated Web Map Tile Service imagery and live layer dates |
| NASA SMAP L3 Passive Enhanced Day Soil Moisture | https://gibs.earthdata.nasa.gov/layer-metadata/v1.0/SMAP_L3_Passive_Enhanced_Day_Soil_Moisture.json | Regional surface-soil-moisture map layer |
| NASA MODIS Terra Corrected Reflectance True Color | https://gibs.earthdata.nasa.gov/layer-metadata/v1.0/MODIS_Terra_CorrectedReflectance_TrueColor.json | True-colour satellite context |
| NASA MODIS Terra Land Surface Temperature Day | https://gibs.earthdata.nasa.gov/layer-metadata/v1.0/MODIS_Terra_Land_Surface_Temp_Day.json | Daytime land-surface-temperature map layer |

Do not list GPM, SRTM, ECOSTRESS or FAO GAEZ as implemented data sources in V1. They are research/future-integration candidates, not part of the current live decision engine.

## Space Agency Partner & Other Data / Resources

Add the principal resources below. The complete open-source dependency list remains available in the repository's `package.json`.

| Link Text | Link URL | Use in Musim |
|---|---|---|
| OpenStreetMap | https://www.openstreetmap.org/copyright | Map basemap and geographic context |
| MapLibre GL JS | https://maplibre.org/maplibre-gl-js/docs/ | Interactive map rendering and field drawing |
| Next.js | https://nextjs.org/ | Application framework and server routes |
| React | https://react.dev/ | User interface framework |
| Google Vertex AI — Gemini Express Mode | https://docs.cloud.google.com/vertex-ai/generative-ai/docs/samples/googlegenaisdk-vertexai-express-mode | Optional runtime explanation assistant |
| Vercel AI SDK | https://ai-sdk.dev/docs/introduction | Streaming Gemini integration |
| Vercel | https://vercel.com/ | Public application hosting |
| OpenAI Codex | https://openai.com/codex/ | Disclosed development, research and documentation assistance |
| MUSIM dependency manifest | https://github.com/luqmanks/Musim/blob/main/package.json | Full list of open-source software dependencies |
| Malaysia Department of Agriculture GeoTanih | https://epengembangan.doa.gov.my/perkhidmatan/khidmat-teknikal-ms/geotanih/ | Malaysian soil and agricultural-context research |
| Department of Statistics Malaysia agricultural accounts | https://www.dosm.gov.my/portal-main/release-content/supply-and-utilization-accounts-selected-agricultural-commodities-malaysia-2025 | Malaysian agricultural-context research |

## Submission Verification

These final actions must be completed by a team member:

- Open the demo link and final-project link in an incognito window.
- Confirm the demo is no longer than 30 seconds or seven slides.
- Confirm every external code, text, data and image source is represented above or in the repository.
- Select the applicable SI-use options honestly.
- Read and personally accept the Terms and Conditions.
- Personally confirm that the submission represents the team's original work.
- Save, then choose **Submit for Judging**; saving alone does not submit the project.

