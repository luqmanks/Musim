// Builds the Gemini prompt for the AI field advisor (server-side only).
// The server re-fetches NASA POWER and re-runs the rules itself, so the model only
// sees data we produced, never a table sent by the browser.

import type { CropAlert, CropProfile } from "./cropRules";
import { CROP_LABELS, type FarmProfile } from "./field-shift";
import { POWER_PARAMS, type PowerData } from "./power";

export const ADVISOR_HEADINGS = ["Summary", "Main risks", "What to do this week", "Keep an eye on"] as const;

export const ADVISOR_SYSTEM = `You are a practical field agronomist advising Malaysian estate managers and smallholders.
You are given NASA POWER daily weather and soil data for one location, the crop, and rule-based alerts already computed from that data.

Rules:
- Base every claim on the data provided. Quote dates and numbers (e.g. "19 mm on 10 Nov").
- The data is about the past only. You have no forecast. Never predict specific future weather. You may say what to prepare for if current patterns continue.
- The grid cell is about 50 km wide, so it describes the surrounding area, not one field. Say so if it matters.
- The newest days may be missing ("-"). Don't treat missing values as zero.
- Rule alerts are coarse heuristics. You may agree, add nuance, or point out risks they miss (e.g. season, crop stage, pest pressure linked to the weather), but say when you are inferring.
- Be concise and concrete: under 250 words. Write plain text, no markdown symbols except "- " for bullets.
- Use exactly these headings, each on its own line followed by bullets: ${ADVISOR_HEADINGS.join(", ")}.
- If the user asks a question, answer it first under the "Summary" heading.
- Farmer-reported field details (soil, water, equipment, market) are context. Use them to tailor actions, and treat "unknown" as an information gap to check locally.
- This is decision support, not a substitute for a local extension officer. Recommend one when a risk is serious.`;

// Allow-listed farm-details answers (from the Field Shift "Farm details" step). Anything else is dropped,
// so free text from the browser never reaches the prompt through this path.
const FARM_LABELS = {
  soil: { "clay-poor": "clay, slow drainage", loam: "loam, moderate drainage", sandy: "sandy, fast drainage", peat: "peat or organic soil" },
  water: { reliable: "reliable irrigation", seasonal: "seasonal water availability", limited: "limited water, dry periods restrict planting" },
  equipment: { standard: "standard paddy equipment", flexible: "equipment for several crops", manual: "mostly manual" },
  market: { local: "local buyers available", contract: "contract buyer", limited: "limited buyers" },
} as const;

export function farmContext(raw: unknown): string | null {
  if (!raw || typeof raw !== "object") return null;
  const p = raw as Partial<Record<keyof FarmProfile, unknown>>;
  const lines: string[] = [];
  if (Array.isArray(p.rotation)) {
    const crops = p.rotation.slice(0, 3).filter((c): c is string => typeof c === "string" && c in CROP_LABELS);
    if (crops.length) lines.push(`Current rotation: ${crops.map((c) => CROP_LABELS[c]).join(" -> ")}`);
  }
  for (const key of ["soil", "water", "equipment", "market"] as const) {
    const v = p[key];
    const labels = FARM_LABELS[key] as Record<string, string>;
    lines.push(`${key[0].toUpperCase()}${key.slice(1)}: ${typeof v === "string" && labels[v] ? labels[v] : "unknown"}`);
  }
  return lines.join("\n");
}

const cell = (v: number | null, d = 1) => (v === null ? "-" : v.toFixed(d));

export function buildAdvisorPrompt(opts: {
  crop: CropProfile;
  data: PowerData;
  alerts: CropAlert[];
  today: string;
  question?: string;
  farm?: string | null;
}): string {
  const { crop, data, alerts, today, question, farm } = opts;
  const days = 30;
  const from = Math.max(0, data.dates.length - days);
  const cols = POWER_PARAMS.map((p) => `${p.id}(${p.unit})`);
  const rows = data.dates.slice(from).map((date, k) => {
    const i = from + k;
    return [date, ...POWER_PARAMS.map((p) => cell(data.series[p.id][i], p.id.startsWith("GWET") ? 2 : 1))].join(" | ");
  });

  const rain = data.series.PRECTOTCORR.filter((v): v is number => v !== null);
  const t = data.series.T2M.filter((v): v is number => v !== null);
  const avg = (a: number[]) => (a.length ? (a.reduce((s, v) => s + v, 0) / a.length).toFixed(1) : "-");

  const alertText = alerts.length
    ? alerts.map((a) => `- [${a.level}] ${a.title}. ${a.detail} (data up to ${a.asOf ?? "?"})`).join("\n")
    : "- none";

  return `Today: ${today}
Location: lat ${data.lat}, lng ${data.lng}${data.elevation != null ? `, elevation ${Math.round(data.elevation)} m` : ""}
Crop: ${crop.name}. ${crop.note}
${farm ? `Farmer-reported field details (not verified):
${farm}
` : ""}
Crop thresholds used by the rules: dry spell ${crop.dryDays} days, rain need ${crop.rain30Min} mm/30 days, root-zone dry < ${crop.rootDry}${crop.rootWet !== null ? `, waterlogged > ${crop.rootWet}` : ""}, heavy rain ${crop.heavyRain} mm/day, heat ${crop.heatMax} °C${crop.disease ? `, main humid-weather disease: ${crop.disease}` : ""}.

${data.dates.length}-day context (${data.dates[0]} to ${data.dates.at(-1)}): total rain ${Math.round(rain.reduce((s, v) => s + v, 0))} mm, mean temperature ${avg(t)} °C.

Rule-based alerts:
${alertText}

Last ${rows.length} days (date | ${cols.join(" | ")}):
${rows.join("\n")}

${question ? `User question: ${question}` : "Give your assessment of crop stress risk for this location now."}`;
}
