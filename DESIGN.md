---
name: Musim Field Shift
description: A practical field companion that turns climate evidence into farmer-led rotation choices.
colors:
  field-ink: "#102a2a"
  weathered-slate: "#47615d"
  rice-paper: "#f7f5eb"
  paddy-husk: "#ece9da"
  warm-white: "#fffefa"
  young-paddy: "#a8cf45"
  leaf-green: "#507326"
  monsoon-teal: "#0b4a5b"
  deep-monsoon: "#07333e"
  rain-sky: "#70bfc4"
  rain-blue: "#347f9b"
  heat-orange: "#e56b38"
  field-line: "rgba(16, 42, 42, 0.15)"
typography:
  display:
    fontFamily: "var(--font-bebas-neue), Impact, sans-serif"
    fontSize: "clamp(2.375rem, 5vw, 3.3125rem)"
    fontWeight: 400
    lineHeight: 0.95
    letterSpacing: "0.015em"
  headline:
    fontFamily: "var(--font-nunito), ui-sans-serif, system-ui, sans-serif"
    fontSize: "1.4375rem"
    fontWeight: 800
    lineHeight: 1.15
  title:
    fontFamily: "var(--font-nunito), ui-sans-serif, system-ui, sans-serif"
    fontSize: "1rem"
    fontWeight: 800
    lineHeight: 1.3
  body:
    fontFamily: "var(--font-nunito), ui-sans-serif, system-ui, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 400
    lineHeight: 1.5
  label:
    fontFamily: "var(--font-nunito), ui-sans-serif, system-ui, sans-serif"
    fontSize: "0.6875rem"
    fontWeight: 800
    lineHeight: 1.2
    letterSpacing: "0.04em"
rounded:
  sm: "9px"
  md: "12px"
  lg: "14px"
  panel: "22px"
  pill: "999px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "12px"
  lg: "20px"
  xl: "28px"
components:
  button-primary:
    backgroundColor: "{colors.monsoon-teal}"
    textColor: "{colors.warm-white}"
    typography: "{typography.body}"
    rounded: "{rounded.md}"
    padding: "14px 18px"
    height: "48px"
  button-secondary:
    backgroundColor: "{colors.warm-white}"
    textColor: "{colors.monsoon-teal}"
    typography: "{typography.body}"
    rounded: "{rounded.md}"
    padding: "12px 16px"
    height: "44px"
  field-input:
    backgroundColor: "{colors.warm-white}"
    textColor: "{colors.field-ink}"
    typography: "{typography.body}"
    rounded: "{rounded.sm}"
    padding: "0 11px"
    height: "43px"
  evidence-chip:
    backgroundColor: "{colors.rice-paper}"
    textColor: "{colors.weathered-slate}"
    typography: "{typography.label}"
    rounded: "{rounded.pill}"
    padding: "6px 10px"
  rotation-card:
    backgroundColor: "{colors.warm-white}"
    textColor: "{colors.field-ink}"
    rounded: "{rounded.lg}"
    padding: "16px"
---

# Design System: Musim Field Shift

## Overview

**Creative North Star: "The Field Companion"**

Musim should feel like a trusted field notebook made more capable by satellite evidence: practical, calm, and easy to use with dusty hands or limited technical experience. Familiar farming language leads; scientific detail remains close at hand for people who want to inspect the evidence.

The interface is warm and grounded rather than clinical. It uses generous touch targets, plain explanations, and a map that supports the decision instead of dominating it. Recommendations remain visibly uncertain and invite local validation, because the product supports farmer and adviser judgment rather than replacing it.

**Key Characteristics:**

- Farmer priorities lead the scoring and explanation.
- Warm paper surfaces sit over deep monsoon tones and living crop greens.
- Evidence is layered from a plain-language takeaway to source and confidence detail.
- Controls remain usable outdoors, on small screens, and without geospatial expertise.
- Local knowledge is treated as a required input, not an afterthought.

## Colors

The palette pairs deep wet-season teals with rice-paper neutrals, young crop greens, and restrained weather signals.

### Primary

- **Monsoon Teal:** The main action color and the anchor for high-trust controls.
- **Deep Monsoon:** The map shell, navigation plate, and strongest contrast surface.

### Secondary

- **Young Paddy:** Selected states, progress, and positive field signals.
- **Leaf Green:** Readable green text and supporting emphasis on light surfaces.

### Tertiary

- **Rain Blue:** Water and rainfall evidence.
- **Heat Orange:** Heat stress, map pins, and cautionary environmental signals.

### Neutral

- **Field Ink:** Primary text and data labels.
- **Weathered Slate:** Explanations, metadata, and secondary text.
- **Rice Paper:** The page-level warm neutral.
- **Paddy Husk:** Quiet dividers and unselected tracks.
- **Warm White:** Cards, inputs, and high-clarity working surfaces.
- **Field Line:** Low-contrast structural borders.

**The Weather-Signal Rule.** Reserve blue and orange for environmental meaning; do not use them as arbitrary decoration.

## Typography

**Display Font:** Bebas Neue (with Impact and sans-serif fallbacks)  
**Body Font:** Nunito (with system sans-serif fallbacks)

**Character:** Condensed display type gives the product a confident agricultural identity, while the rounded body face keeps instructions friendly and readable. Data labels are sturdy and compact, never cryptic.

### Hierarchy

- **Display:** Reserved for the main step or results statement; keep it short and sentence-like.
- **Headline:** Used for section decisions and important farmer-facing questions.
- **Title:** Used for cards, scenarios, and compact content groups.
- **Body:** Used for explanations and decision guidance; prefer short paragraphs and direct verbs.
- **Label:** Used for categories and compact metadata; uppercase is acceptable only for short, scannable labels.

**The Plain-Language-First Rule.** State the field meaning before introducing an acronym such as NDVI or evapotranspiration, and explain the term where it appears.

## Layout

The core desktop composition is a fixed-width decision panel beside a full-field map. Results expand into a wider comparison surface while retaining map context. At tablet and mobile widths, controls stack, touch targets grow, and map callouts wrap within the viewport; no task depends on hover.

Spacing follows a compact field-tool rhythm: tight grouping inside controls, moderate separation between related blocks, and a clear pause before the next decision. The four-step journey remains visible so farmers know how much work remains. Long place names and large area values must wrap rather than push controls off-screen.

**The Decision-Before-Data Rule.** Lead each view with the choice or takeaway, then offer conditions, sources, and model detail progressively.

## Elevation & Depth

The system is flat by default. Warm surface changes and fine borders establish most hierarchy; a broad ambient shadow is reserved for panels and map overlays that must remain legible above satellite imagery. Interactive elements use small movement and color shifts, not stacks of decorative shadows.

### Shadow Vocabulary

- **Map Ambient:** A broad, cool shadow for the primary panel and floating map evidence.
- **Marker Lift:** A compact shadow used only to separate the field marker from varied imagery.

**The Map-Only-Glass Rule.** Translucency and backdrop blur belong to controls over imagery; content cards stay opaque and easy to read.

## Shapes

Working controls use gently rounded corners, cards use a slightly softer radius, and the main panel uses a generous but still practical corner. Pills are limited to status chips, tabs, and compact metadata. Borders are complete outlines; avoid decorative left-edge stripes that can be mistaken for status severity.

## Components

### Buttons

- **Shape:** Substantial rounded rectangles with a minimum comfortable touch height.
- **Primary:** Deep teal with warm-white text; use one clear primary action per decision area.
- **Hover / Focus:** A subtle lift or tone change on hover and a highly visible amber focus outline for keyboard use.
- **Secondary:** Warm white with teal text and a quiet field-line border.

### Chips

- **Style:** Compact paper-toned pills for evidence type, confidence, or status.
- **State:** Selected states use crop green or monsoon teal and always retain readable text contrast.

### Cards / Containers

- **Corner Style:** Soft, consistent corners with a complete low-contrast border.
- **Background:** Opaque warm white for reading; paper tones for nested supporting detail.
- **Shadow Strategy:** Flat inside the decision panel; ambient lift only when floating over the map.
- **Internal Padding:** Enough room to separate the takeaway, evidence, and action without wasting small-screen space.

### Inputs / Fields

- **Style:** Warm-white fill, clear border, direct farmer-facing label, and no placeholder-only instructions.
- **Focus:** Amber outline with offset so focus remains visible against both paper and map surfaces.
- **Unknown Values:** Offer an explicit “not sure” path and explain how local verification will be used.

### Navigation

The four-step progress indicator uses crop green for completed and active work. Results tabs name farmer tasks—field conditions and rotation options—rather than internal data structures, and expose selected state through text, color, and semantics.

### Rotation Card

Each option begins with its role in the rotation and a plain-language fit score, then explains benefits, trade-offs, uncertainty, and the evidence behind the score. The recommended treatment is visually stronger but never hides alternatives or local caveats.

## Do's and Don'ts

### Do:

- **Do** let farmers set water, equipment, market, and soil priorities before scoring rotations.
- **Do** pair satellite indicators with ground observations and clearly label confidence and data age.
- **Do** translate scientific measures into a field consequence, then allow the farmer to inspect the technical term.
- **Do** keep essential controls at least comfortable touch size and readable in bright outdoor conditions.
- **Do** identify exactly where an agronomist, extension officer, or farmer should validate the recommendation.

### Don't:

- **Don't** present model outputs as prescriptions or conceal uncertainty behind a single score.
- **Don't** make map drawing the only path; preserve a quick point estimate for farmers without field boundaries.
- **Don't** rely on color alone to communicate stress, confidence, selection, or recommendation.
- **Don't** crowd the first view with raw datasets, unexplained acronyms, or competing primary actions.
- **Don't** use decorative gradients, excessive glass effects, or tiny metadata that weakens field readability.
