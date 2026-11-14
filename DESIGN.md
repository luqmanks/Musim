---
name: Musim Field Shift
description: A farmer-centered field planning interface built entirely on shadcn preset b7Br7G7Ci.
preset: b7Br7G7Ci
style: radix-maia
baseColor: mist
theme: emerald
iconLibrary: lucide
font: inter
radius: medium
colors:
  background: "oklch(1 0 0)"
  foreground: "oklch(0.148 0.004 228.8)"
  primary: "oklch(0.508 0.118 165.612)"
  primary-foreground: "oklch(1 0 0)"
  secondary: "oklch(0.967 0.001 286.375)"
  secondary-foreground: "oklch(0.21 0.006 285.885)"
  muted: "oklch(0.963 0.002 197.1)"
  muted-foreground: "oklch(0.56 0.021 213.5)"
  border: "oklch(0.925 0.005 214.3)"
  ring: "oklch(0.723 0.014 214.4)"
typography:
  family: "var(--font-sans), ui-sans-serif, system-ui, sans-serif"
  headingWeight: 700
  bodyWeight: 400
  controlWeight: 500
rounded:
  base: "0.625rem"
  sm: "calc(var(--radius) * 0.6)"
  md: "calc(var(--radius) * 0.8)"
  lg: "var(--radius)"
  xl: "calc(var(--radius) * 1.4)"
---

# Design System: Musim Field Shift

## Source of truth

The sole interface system is shadcn preset `b7Br7G7Ci`: Maia components, Mist neutrals, Emerald actions, Inter typography, Lucide icons, medium radius, subtle menu accents, and the default menu color. `components.json`, shadcn primitives, and the CSS variables in `app/globals.css` are authoritative.

Product identity comes from the farmer workflow, map context, language, and evidence. Visual decisions remain inside the preset system.

## Principles

- Put the farmer's decision before scientific detail.
- Use familiar controls and plain language suitable for intermittent, outdoor use.
- Keep one clear primary action in each step.
- Reveal evidence progressively; never hide uncertainty or local validation needs.
- Treat satellite observations as decision support, not ground truth.

## Color

Use only preset semantic tokens for interface styling:

- `background` and `card` for working surfaces.
- `foreground` for primary copy.
- `muted` and `muted-foreground` for secondary structure and explanation.
- `primary` and `primary-foreground` for the main action, selection, progress, and active states.
- `secondary` for low-emphasis actions.
- `border`, `input`, and `ring` for structure and keyboard focus.
- `destructive` only for errors or genuinely destructive actions.
- `chart-1` through `chart-5` for data visualization.

Color must communicate action, selection, status, or data.

## Typography

Inter is the only type family. Headings inherit the same family and establish hierarchy with size and weight.

- Page title: 2.25–3rem, weight 700, tight but not below `-0.04em` tracking.
- Section heading: 1.125–1.5rem, weight 600–700.
- Body: 0.875–1rem, weight 400, line height 1.5.
- Label and control: 0.75–0.875rem, weight 500–600.
- Measurements use tabular numerals.

Avoid uppercase display styling and decorative font pairings.

## Shape and depth

The base radius is `0.625rem`. Use preset radius derivatives consistently; pills are reserved for compact controls and statuses. Cards rely on borders and surface contrast. A soft shadow is allowed only where a panel must separate from map imagery.

## Components

Use the generated primitives in `components/ui`:

- `Button` for primary, secondary, outline, ghost, destructive, and icon actions.
- `Tabs` for field selection modes and result views.
- `Select` for location and farm-detail choices.
- `Slider` for farmer priority weights.
- `Dialog` for focused information.
- `Sheet` for save and share actions.

Use Lucide for every interface icon. Do not embed a second icon library or hand-draw replacement glyphs.

## Workflow

Each of the four steps contains one heading, one short instruction, one control group, and one primary action. Keep progress visible without turning it into decoration. Preserve a point-estimate path for farmers who cannot draw a boundary.

Results lead with the practical takeaway, then expose field conditions, rotation options, evidence, confidence, and source timing. Recommendations must state trade-offs and where farmer or agronomist judgment is required.

## Accessibility and responsive behavior

- Maintain at least 44px touch targets for critical actions.
- Preserve visible preset focus rings.
- Do not rely on color alone for selection or status.
- Use labels in addition to placeholders.
- Allow long locations, measurements, and translated text to wrap.
- On small screens, stack the workflow above the map and keep actions reachable without horizontal scrolling.
- Respect reduced-motion preferences.
