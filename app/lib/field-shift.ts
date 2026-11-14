export type PriorityKey =
  | "water"
  | "soil"
  | "income"
  | "erosion"
  | "nitrogen"
  | "practicality";

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

export type ClimateSummary = {
  source: "NASA POWER" | "Demonstration climatology";
  sourceUrl: string;
  period: string;
  resolution: string;
  retrievedAt: string;
  isFallback: boolean;
  annualRainMm: number;
  meanTempC: number;
  hottestMonth: string;
  wettestMonth: string;
  dryMonths: number;
  monthly: MonthlyClimate[];
};

export type RotationScore = {
  id: string;
  label: string;
  descriptor: string;
  crops: string[];
  scores: Record<PriorityKey, number>;
  total: number;
  why: string[];
  evidence: string[];
  risks: string[];
  gaps: string[];
  confidence: "High" | "Moderate" | "Low";
  confidenceReason: string;
};

export const CROPS = [
  { id: "paddy", label: "Paddy" },
  { id: "mung-bean", label: "Mung bean" },
  { id: "maize", label: "Maize" },
  { id: "groundnut", label: "Groundnut" },
  { id: "cover-crop", label: "Cover crop" },
  { id: "fallow", label: "Fallow" },
];

export const CROP_LABELS = Object.fromEntries(
  CROPS.map((crop) => [crop.id, crop.label]),
) as Record<string, string>;

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

const CROP_TRAITS: Record<
  string,
  Record<PriorityKey, number> & { legume: boolean; family: string }
> = {
  paddy: {
    water: 36,
    soil: 58,
    income: 78,
    erosion: 74,
    nitrogen: 38,
    practicality: 92,
    legume: false,
    family: "grass",
  },
  "mung-bean": {
    water: 88,
    soil: 88,
    income: 70,
    erosion: 68,
    nitrogen: 94,
    practicality: 70,
    legume: true,
    family: "legume",
  },
  maize: {
    water: 68,
    soil: 55,
    income: 72,
    erosion: 48,
    nitrogen: 30,
    practicality: 72,
    legume: false,
    family: "grass",
  },
  groundnut: {
    water: 76,
    soil: 84,
    income: 74,
    erosion: 72,
    nitrogen: 88,
    practicality: 62,
    legume: true,
    family: "legume",
  },
  "cover-crop": {
    water: 80,
    soil: 95,
    income: 32,
    erosion: 96,
    nitrogen: 82,
    practicality: 66,
    legume: true,
    family: "cover",
  },
  fallow: {
    water: 92,
    soil: 34,
    income: 10,
    erosion: 22,
    nitrogen: 28,
    practicality: 88,
    legume: false,
    family: "none",
  },
};

const PRIORITY_KEYS: PriorityKey[] = [
  "water",
  "soil",
  "income",
  "erosion",
  "nitrogen",
  "practicality",
];

function clamp(value: number) {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function average(crops: string[], key: PriorityKey) {
  const values = crops.map((crop) => CROP_TRAITS[crop]?.[key] ?? 50);
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function confidenceFor(
  profile: FarmProfile,
  climate: ClimateSummary,
  isAlternative: boolean,
) {
  let confidence = climate.isFallback ? 36 : 68;
  if (profile.soil !== "unknown") confidence += 12;
  if (profile.water !== "unknown") confidence += 8;
  if (profile.market !== "unknown") confidence += 5;
  if (isAlternative) confidence -= 4;
  if (confidence >= 78) {
    return {
      level: "High" as const,
      reason: "Strong climate coverage and a mostly complete farm profile.",
    };
  }
  if (confidence >= 52) {
    return {
      level: "Moderate" as const,
      reason: "Climate evidence is useful, but local field details still need checking.",
    };
  }
  return {
    level: "Low" as const,
    reason: "Several inputs are missing or demonstration climate data was used.",
  };
}

export function buildRotationResults(
  profile: FarmProfile,
  priorities: Record<PriorityKey, number>,
  climate: ClimateSummary,
  scenario: ScenarioKey,
): RotationScore[] {
  const candidates = [
    {
      id: "current",
      label: "Current practice",
      descriptor: "Your baseline",
      crops: profile.rotation,
    },
    {
      id: "conservative",
      label: "Option A",
      descriptor: "Low-disruption shift",
      crops: ["paddy", "mung-bean", "paddy"],
    },
    {
      id: "resilient",
      label: "Option B",
      descriptor: "Resilience first",
      crops: ["paddy", "cover-crop", "groundnut"],
    },
  ];

  const scenarioAdjustments: Record<
    ScenarioKey,
    Partial<Record<PriorityKey, number>>
  > = {
    typical: {},
    dry: { water: -10, income: -4 },
    wet: { erosion: -7, practicality: -3 },
    hotter: { water: -7, income: -5 },
  };

  return candidates
    .map((candidate) => {
      const families = candidate.crops.map(
        (crop) => CROP_TRAITS[crop]?.family ?? crop,
      );
      const diversity = new Set(families).size;
      const hasLegume = candidate.crops.some(
        (crop) => CROP_TRAITS[crop]?.legume,
      );
      const repeatPenalty = families.filter(
        (family, index) => index > 0 && family === families[index - 1],
      ).length;

      const scores = Object.fromEntries(
        PRIORITY_KEYS.map((key) => {
          let value = average(candidate.crops, key);
          if (key === "soil") value += diversity * 4 - repeatPenalty * 8;
          if (key === "nitrogen" && hasLegume) value += 8;
          if (key === "erosion" && candidate.crops.includes("fallow")) value -= 12;
          if (key === "water" && climate.annualRainMm > 2200) value += 4;
          if (key === "practicality" && candidate.id !== "current") value -= 5;
          if (profile.market === "limited" && candidate.id !== "current" && key === "income") {
            value -= 12;
          }
          if (profile.water === "limited" && candidate.crops.includes("paddy") && key === "water") {
            value -= 7;
          }
          value += scenarioAdjustments[scenario][key] ?? 0;
          if (scenario === "dry" && !candidate.crops.includes("paddy") && key === "water") {
            value += 8;
          }
          if (scenario === "wet" && candidate.crops.includes("paddy") && key === "practicality") {
            value += 5;
          }
          return [key, clamp(value)];
        }),
      ) as Record<PriorityKey, number>;

      const totalWeight = PRIORITY_KEYS.reduce(
        (sum, key) => sum + priorities[key],
        0,
      );
      const total = clamp(
        PRIORITY_KEYS.reduce(
          (sum, key) => sum + scores[key] * priorities[key],
          0,
        ) / totalWeight,
      );
      const confidence = confidenceFor(
        profile,
        climate,
        candidate.id !== "current",
      );
      const gaps: string[] = [];
      if (profile.soil === "unknown") gaps.push("Soil texture and drainage");
      if (profile.water === "unknown") gaps.push("Irrigation reliability");
      if (profile.market === "unknown") gaps.push("Local buyer and price access");
      if (climate.isFallback) gaps.push("Live NASA POWER response");

      const why = candidate.id === "current"
        ? [
            "Keeps the familiar crop sequence and equipment needs.",
            repeatPenalty
              ? "Repeated crop families reduce the soil-diversity score."
              : "The current sequence already provides some crop diversity.",
          ]
        : candidate.id === "conservative"
          ? [
              "A short-duration legume interrupts repeated paddy seasons.",
              "Mung bean can reduce water demand during the drier part of the year.",
            ]
          : [
              "Continuous ground cover reduces bare-soil exposure in heavy rain.",
              "Two legumes strengthen nitrogen and soil-health performance.",
            ];

      const risks = candidate.id === "current"
        ? ["Repeated paddy can maintain high irrigation dependence."]
        : candidate.id === "conservative"
          ? ["Confirm drainage, seed availability and a buyer for mung bean."]
          : [
              "Requires the largest change in field practice and market planning.",
              "Groundnut is unsuitable when drainage remains poor.",
            ];

      return {
        ...candidate,
        scores,
        total,
        why,
        evidence: [
          `${climate.source}: ${Math.round(climate.annualRainMm).toLocaleString()} mm typical annual rainfall (${climate.period}).`,
          `${climate.wettestMonth} is the wettest month in the climate profile.`,
          `NASA-derived temperature profile averages ${climate.meanTempC.toFixed(1)} °C.`,
        ],
        risks,
        gaps,
        confidence: confidence.level,
        confidenceReason: confidence.reason,
      };
    })
    .sort((a, b) => {
      if (a.id === "current") return -1;
      if (b.id === "current") return 1;
      return b.total - a.total;
    });
}

export function cropLabel(id: string) {
  return CROP_LABELS[id] ?? id;
}

