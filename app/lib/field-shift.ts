// Rotation engine. Everything that varies by place comes from the NASA POWER climate profile
// (see app/lib/climate.ts): season windows, water balance, temperature fit, erosion exposure,
// scenarios and the explanations. Crop requirements live in crop-reference.ts. The only other
// inputs are the farmer's own answers and priority sliders.

import { CROP_BY_ID, CROP_REFERENCE, type CropReference } from "./crop-reference";

export type PriorityKey = "water" | "soil" | "income" | "erosion" | "nitrogen" | "practicality";
export type ScenarioKey = "typical" | "dry" | "wet" | "hotter";

export type FieldLocation = {
  lat: number;
  lng: number;
  name: string;
  farmId?: string;
  boundary?: [lng: number, lat: number][];
  areaHectares?: number;
};

export type FarmProfile = {
  rotation: string[];
  soil: string;
  water: string;
  equipment: string;
  market: string;
};

export type MonthlyClimate = {
  month: number;
  label: string;
  rainMm: number;
  tempC: number;
  maxTempC: number;
  humidity: number;
  solar: number;
};

export type YearClimate = {
  year: number;
  monthly: MonthlyClimate[];
  annualRainMm: number;
  meanTempC: number;
  complete: boolean;
};

export type ClimateSummary = {
  source: string;
  sourceUrl: string;
  period: string;
  resolution: string;
  retrievedAt: string;
  annualRainMm: number;
  meanTempC: number;
  hottestMonth: string;
  wettestMonth: string;
  dryMonths: number; // Gaussen index: months where rain (mm) < 2 x mean temperature (°C)
  monthly: MonthlyClimate[]; // typical year
  years: YearClimate[]; // each observed year
  scenarioYears: { dry: number; wet: number; hotter: number }; // observed years used for the stress tests
  coverage: number; // 0..1 share of daily values NASA returned
};

export type SeasonDetail = {
  window: string; // e.g. "Sep–Dec"
  crop: string;
  rainMm: number;
  tempC: number;
  needMm: number;
  deficitMm: number;
};

export type RotationScore = {
  id: string;
  label: string;
  descriptor: string;
  crops: string[];
  seasons: SeasonDetail[];
  changes: number; // seasons that differ from the current rotation
  scores: Record<PriorityKey, number>;
  total: number;
  why: string[];
  evidence: string[];
  risks: string[];
  gaps: string[];
  confidence: "High" | "Moderate" | "Low";
  confidenceReason: string;
};

export const CROPS = CROP_REFERENCE.map(({ id, label }) => ({ id, label }));
export const CROP_LABELS = Object.fromEntries(CROPS.map((c) => [c.id, c.label])) as Record<string, string>;

export const DEFAULT_PROFILE: FarmProfile = {
  rotation: ["paddy", "paddy", "fallow"],
  soil: "unknown",
  water: "seasonal",
  equipment: "standard",
  market: "local",
};

export const DEFAULT_PRIORITIES: Record<PriorityKey, number> = {
  water: 5,
  soil: 5,
  income: 4,
  erosion: 3,
  nitrogen: 3,
  practicality: 4,
};

const PRIORITY_KEYS: PriorityKey[] = ["water", "soil", "income", "erosion", "nitrogen", "practicality"];
const PRIORITY_LABEL: Record<PriorityKey, string> = {
  water: "Water saving",
  soil: "Soil health",
  income: "Income potential",
  erosion: "Erosion protection",
  nitrogen: "Nitrogen supply",
  practicality: "Practicality",
};

// Structure of the plan: three consecutive seasons of four months.
const SEASON_COUNT = 3;
const SEASON_MONTHS = 4;

// How the farmer's multiple-choice answers are read.
const IRRIGATION_AVAILABLE: Record<string, number> = { reliable: 1, seasonal: 0.5, limited: 0, unknown: 0.5 };
const SLOW_DRAINAGE = new Set(["clay-poor"]);
const EQUIPMENT_CAN_RUN: Record<string, Array<CropReference["equipment"]>> = {
  standard: ["paddy", "none"],
  flexible: ["paddy", "upland", "none"],
  manual: ["paddy", "upland", "none"],
};

const clamp01 = (v: number) => Math.max(0, Math.min(1, v));
const pct = (v: number) => Math.round(clamp01(v) * 100);
const mean = (a: number[]) => (a.length ? a.reduce((s, v) => s + v, 0) / a.length : 0);
const crop = (id: string): CropReference => CROP_BY_ID[id] ?? CROP_BY_ID.fallow;

type Season = { window: string; rainMm: number; tempC: number };

function monthsOfSeason(startMonth: number, s: number) {
  return Array.from({ length: SEASON_MONTHS }, (_, k) => (startMonth + s * SEASON_MONTHS + k) % 12);
}

/** Season 1 starts at the first month of the wettest four-month stretch of the typical year. */
function seasonStart(typical: MonthlyClimate[]) {
  let start = 0;
  let wettest = -Infinity;
  for (let i = 0; i < 12; i++) {
    const rain = monthsOfSeason(i, 0).reduce((s, m) => s + typical[m].rainMm, 0);
    if (rain > wettest) { wettest = rain; start = i; }
  }
  return start;
}

export function climateFor(climate: ClimateSummary, scenario: ScenarioKey): MonthlyClimate[] {
  if (scenario === "typical") return climate.monthly;
  const year = climate.years.find((y) => y.year === climate.scenarioYears[scenario]);
  return year?.monthly ?? climate.monthly;
}

function seasonsFor(climate: ClimateSummary, scenario: ScenarioKey): Season[] {
  const start = seasonStart(climate.monthly);
  const monthly = climateFor(climate, scenario);
  return Array.from({ length: SEASON_COUNT }, (_, s) => {
    const idx = monthsOfSeason(start, s);
    return {
      window: `${monthly[idx[0]].label}–${monthly[idx[idx.length - 1]].label}`,
      rainMm: idx.reduce((sum, m) => sum + monthly[m].rainMm, 0),
      tempC: mean(idx.map((m) => monthly[m].tempC)),
    };
  });
}

/** 1 inside the crop's comfortable range, falling to 0 at the temperature where it fails. */
function tempFit(c: CropReference, t: number) {
  const [o0, o1] = c.tempOpt;
  const [a0, a1] = c.tempAbs;
  if (t >= o0 && t <= o1) return 1;
  return t < o0 ? clamp01((t - a0) / (o0 - a0)) : clamp01((a1 - t) / (a1 - o1));
}

type SeasonEval = {
  crop: CropReference;
  season: Season;
  deficitMm: number;
  excessMm: number;
  fit: number; // 0..1 climate fit
  tempFit: number;
  equipmentOk: boolean | null; // null when the farmer doesn't know their equipment
};

function evalSeason(c: CropReference, season: Season, profile: FarmProfile): SeasonEval {
  const deficitMm = Math.max(0, c.needMm - season.rainMm);
  const usable = IRRIGATION_AVAILABLE[profile.water] ?? 0.5;
  const watered = c.needMm ? clamp01((season.rainMm + deficitMm * usable) / c.needMm) : 1;
  const excessMm = c.rainMaxMm !== null && SLOW_DRAINAGE.has(profile.soil) ? Math.max(0, season.rainMm - c.rainMaxMm) : 0;
  const drained = c.rainMaxMm !== null ? clamp01(1 - excessMm / c.rainMaxMm) : 1;
  const t = tempFit(c, season.tempC);
  const can = EQUIPMENT_CAN_RUN[profile.equipment];
  return { crop: c, season, deficitMm, excessMm, fit: watered * drained * t, tempFit: t, equipmentOk: can ? can.includes(c.equipment) : null };
}

type Evaluated = { crops: string[]; evals: SeasonEval[]; scores: Record<PriorityKey, number>; total: number };

const WATER_REFERENCE_MM = Math.max(...CROP_REFERENCE.map((c) => c.needMm));

function evaluate(
  crops: string[],
  profile: FarmProfile,
  priorities: Record<PriorityKey, number>,
  seasons: Season[],
): Evaluated {
  const evals = crops.map((id, i) => evalSeason(crop(id), seasons[i], profile));
  const refs = evals.map((e) => e.crop);
  const families = refs.map((c) => c.family);
  const repeats = families.filter((f, i) => i > 0 && f === families[i - 1]).length;
  const peakRain = Math.max(...seasons.map((s) => s.rainMm), 1);
  const equipChecks = evals.flatMap((e) => (e.equipmentOk === null ? [] : [e.equipmentOk ? 1 : 0]));
  const kept = crops.filter((id, i) => id === profile.rotation[i]).length / crops.length;

  const scores: Record<PriorityKey, number> = {
    water: pct(mean(evals.map((e) => 1 - e.deficitMm / WATER_REFERENCE_MM))),
    soil: pct(mean([new Set(families).size / families.length, 1 - repeats / Math.max(1, families.length - 1), refs.some((c) => c.legume) ? 1 : 0])),
    income: pct(mean(evals.map((e) => (e.crop.yields ? e.fit : 0)))),
    erosion: pct(mean(evals.map((e) => 1 - (e.season.rainMm / peakRain) * e.crop.erosionExposure))),
    nitrogen: pct(refs.filter((c) => c.legume).length / refs.length),
    practicality: pct(mean([kept, ...(equipChecks.length ? [mean(equipChecks)] : [])])),
  };
  const weight = PRIORITY_KEYS.reduce((s, k) => s + priorities[k], 0) || 1;
  const total = Math.round(PRIORITY_KEYS.reduce((s, k) => s + scores[k] * priorities[k], 0) / weight);
  return { crops, evals, scores, total };
}

function allRotations(): string[][] {
  const ids = CROP_REFERENCE.map((c) => c.id);
  let combos: string[][] = [[]];
  for (let i = 0; i < SEASON_COUNT; i++) combos = combos.flatMap((c) => ids.map((id) => [...c, id]));
  return combos;
}

const same = (a: string[], b: string[]) => a.every((v, i) => v === b[i]);
const distance = (a: string[], b: string[]) => a.filter((v, i) => v !== b[i]).length;

export function scenarioNote(climate: ClimateSummary, key: ScenarioKey): string {
  if (key === "typical") return `Average of ${climate.period}`;
  const year = climate.years.find((y) => y.year === climate.scenarioYears[key]);
  if (!year) return "Observed year from NASA POWER";
  if (key === "hotter") return `Hottest year, ${year.year}: ${year.meanTempC.toFixed(1)} °C average`;
  return `${key === "dry" ? "Driest" : "Wettest"} year, ${year.year}: ${Math.round(year.annualRainMm).toLocaleString()} mm rain`;
}

export function buildRotationResults(
  profile: FarmProfile,
  priorities: Record<PriorityKey, number>,
  climate: ClimateSummary,
  scenario: ScenarioKey,
): RotationScore[] {
  const seasons = seasonsFor(climate, scenario);
  const current = profile.rotation.slice(0, SEASON_COUNT);
  while (current.length < SEASON_COUNT) current.push("fallow");
  const run = (crops: string[], s = seasons) => evaluate(crops, profile, priorities, s);

  // Search every three-season combination for the best fit, and the best single-season change.
  const ranked = allRotations()
    .filter((c) => !same(c, current))
    .map((c) => run(c))
    .sort((a, b) => b.total - a.total || distance(a.crops, current) - distance(b.crops, current));
  const best = ranked[0];
  const smallest = ranked.find((r) => r !== best && distance(r.crops, current) === 1) ?? ranked[1];
  const chosen = [
    { id: "best", descriptor: "Best fit for your goals", ev: best },
    { id: "smallest-change", descriptor: "Smallest change from today", ev: smallest },
  ].filter((c) => c.ev);
  const currentEval = run(current);

  // Does each option still beat today's rotation in the driest, wettest and hottest observed years?
  const stress = (["dry", "wet", "hotter"] as ScenarioKey[]).map((k) => {
    const s = seasonsFor(climate, k);
    return { now: run(current, s).total, of: (crops: string[]) => run(crops, s).total };
  });

  const gapsBase: string[] = [];
  if (profile.soil === "unknown") gapsBase.push("Soil texture and drainage");
  if (profile.water === "unknown") gapsBase.push("Irrigation reliability");
  if (profile.market === "unknown") gapsBase.push("Local buyer and price access");
  if (profile.equipment === "unknown") gapsBase.push("Equipment available for new crops");
  if (climate.coverage < 1) gapsBase.push(`${(100 - climate.coverage * 100).toFixed(1)}% of daily NASA values were missing`);

  const describe = (id: string, label: string, descriptor: string, ev: Evaluated): RotationScore => {
    const isCurrent = id === "current";
    const gaps = [...gapsBase];
    const robust = isCurrent || stress.every((s) => s.of(ev.crops) >= s.now);
    // A season is a climate mismatch when rain, usable irrigation, drainage or temperature can't fully meet the crop.
    const mismatches = ev.evals.filter((e) => e.fit < 1).length;
    const confidence: RotationScore["confidence"] = !gaps.length && robust && !mismatches ? "High" : gaps.length <= 2 ? "Moderate" : "Low";

    const seasonsDetail: SeasonDetail[] = ev.evals.map((e) => ({
      window: e.season.window,
      crop: e.crop.id,
      rainMm: e.season.rainMm,
      tempC: e.season.tempC,
      needMm: e.crop.needMm,
      deficitMm: e.deficitMm,
    }));

    const why: string[] = [];
    if (isCurrent) {
      const order = [...PRIORITY_KEYS].sort((a, b) => ev.scores[b] - ev.scores[a]);
      why.push(`Strongest area: ${PRIORITY_LABEL[order[0]].toLowerCase()} (${ev.scores[order[0]]}/100).`);
      why.push(`Weakest area: ${PRIORITY_LABEL[order[5]].toLowerCase()} (${ev.scores[order[5]]}/100).`);
    } else {
      PRIORITY_KEYS
        .map((k) => ({ k, gain: ev.scores[k] - currentEval.scores[k] }))
        .filter((x) => x.gain > 0)
        .sort((a, b) => b.gain * priorities[b.k] - a.gain * priorities[a.k])
        .slice(0, 2)
        .forEach(({ k }) => why.push(`${PRIORITY_LABEL[k]} ${ev.scores[k]} vs ${currentEval.scores[k]} for your current rotation.`));
      if (!why.length) why.push("No area scores higher than your current rotation under these goals and this climate.");
    }

    const evidence = [
      `${climate.source}: ${Math.round(climate.annualRainMm).toLocaleString()} mm typical annual rainfall (${climate.period}).`,
      `${climate.wettestMonth} is the wettest month; the planting year starts in the wettest four-month stretch.`,
      `NASA-derived temperature profile averages ${climate.meanTempC.toFixed(1)} °C.`,
      ...ev.evals.map((e, i) =>
        `Season ${i + 1} (${e.season.window}, ${e.crop.label}): ${Math.round(e.season.rainMm)} mm rain, ${e.season.tempC.toFixed(1)} °C` +
        (e.crop.needMm ? `; needs ~${e.crop.needMm} mm${e.deficitMm > 0 ? `, ~${Math.round(e.deficitMm)} mm short` : ", covered by rain"}.` : "."),
      ),
    ];

    const risks: string[] = [];
    ev.evals.forEach((e, i) => {
      const where = `Season ${i + 1} (${e.crop.label})`;
      if (e.deficitMm > 0) {
        const usable = IRRIGATION_AVAILABLE[profile.water] ?? 0.5;
        risks.push(`${where}: about ${Math.round(e.deficitMm)} mm short of rain${usable < 1 ? `, and irrigation is ${profile.water === "unknown" ? "unconfirmed" : profile.water}` : ""}.`);
      }
      if (e.excessMm > 0) risks.push(`${where}: ${Math.round(e.season.rainMm)} mm rain exceeds ${e.crop.rainMaxMm} mm on slow-draining soil.`);
      if (e.tempFit < 1) risks.push(`${where}: ${e.season.tempC.toFixed(1)} °C is outside the comfortable ${e.crop.tempOpt[0]}–${e.crop.tempOpt[1]} °C range.`);
      if (e.equipmentOk === false) risks.push(`${where}: needs ${e.crop.equipment} equipment you may not have.`);
      if (!isCurrent && e.crop.yields && !profile.rotation.includes(e.crop.id) && (profile.market === "limited" || profile.market === "unknown")) {
        risks.push(`${where}: new to you, so confirm a buyer first.`);
      }
    });
    if (!isCurrent && !robust) risks.push("The advantage over your current rotation disappears in at least one of the driest, wettest or hottest observed years.");

    return {
      id, label, descriptor,
      crops: ev.crops,
      seasons: seasonsDetail,
      changes: distance(ev.crops, current),
      scores: ev.scores,
      total: ev.total,
      why,
      evidence,
      risks: risks.length ? risks : ["No water, temperature or drainage conflict found against the NASA climate. Confirm locally."],
      gaps,
      confidence,
      confidenceReason: `${gaps.length} information gap${gaps.length === 1 ? "" : "s"}; ${mismatches} season${mismatches === 1 ? "" : "s"} where the NASA climate doesn't fully meet the crop; ${isCurrent ? "baseline for comparison" : robust ? "still ahead of today's rotation in the driest, wettest and hottest observed years" : "not ahead of today's rotation in every observed stress year"}.`,
    };
  };

  const options = chosen
    .map((c) => ({ ...c, ev: c.ev }))
    .sort((a, b) => b.ev.total - a.ev.total)
    .map((c, i) => describe(c.id, `Option ${String.fromCharCode(65 + i)}`, c.descriptor, c.ev));

  return [describe("current", "Current practice", "Your baseline", currentEval), ...options];
}

/** Plain-language reading of the climate profile, written from the numbers. */
export function climateInsight(climate: ClimateSummary): { headline: string; detail: string } {
  const m = climate.monthly;
  const wetIdx = monthsOfSeason(seasonStart(m), 0);
  const wetRain = wetIdx.reduce((s, i) => s + m[i].rainMm, 0);
  const wet = m.reduce((a, b) => (a.rainMm > b.rainMm ? a : b));
  const dry = m.reduce((a, b) => (a.rainMm < b.rainMm ? a : b));
  const lo = climate.years.find((y) => y.year === climate.scenarioYears.dry);
  const hi = climate.years.find((y) => y.year === climate.scenarioYears.wet);
  const share = Math.round((wetRain / climate.annualRainMm) * 100);
  const range =
    climate.years.length > 1 && lo && hi
      ? ` Annual rain ranged from ${Math.round(lo.annualRainMm).toLocaleString()} mm in ${lo.year} to ${Math.round(hi.annualRainMm).toLocaleString()} mm in ${hi.year}, so plan for both.`
      : "";
  const dryText = climate.dryMonths === 0 ? "No month is dry" : `${climate.dryMonths} month${climate.dryMonths === 1 ? " is" : "s are"} dry`;
  return {
    headline: `${wet.label} is the wettest month (${Math.round(wet.rainMm)} mm), and ${share}% of the year's rain falls in ${m[wetIdx[0]].label}–${m[wetIdx[wetIdx.length - 1]].label}.`,
    detail: `${dry.label} is the driest month at ${Math.round(dry.rainMm)} mm. ${dryText} by the Gaussen test (rain below twice the mean temperature).${range}`,
  };
}

export function cropLabel(id: string) {
  return CROP_LABELS[id] ?? id;
}
