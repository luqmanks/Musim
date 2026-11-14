// Rule-of-thumb crop stress signals from NASA POWER daily data.
// These look BACK at measured/modelled weather (POWER has no forecast). Thresholds are
// coarse heuristics for Malaysian conditions, not agronomic advice. Tune per estate.

import { lastN, type PowerData, type PowerParam } from "./power";

export type CropProfile = {
  id: string;
  name: string;
  note: string;
  dryDays: number; // consecutive days < 1 mm rain that count as a damaging dry spell
  rain30Min: number; // mm needed over 30 days
  rootDry: number; // GWETROOT 7-day mean below this = drought stress
  rootWet: number | null; // GWETROOT 7-day mean above this = waterlogging risk (null = crop tolerates it)
  heavyRain: number; // mm in one day that causes damage / flooding
  heatMax: number; // °C daily max that stresses the crop
  disease: string | null; // humid-weather disease to warn about
  lowSun: number | null; // MJ/m²/day 7-day mean below this slows growth
  windMax: number | null; // m/s daily mean wind that risks lodging / toppling
  tapping?: boolean; // rubber: count wet days that disrupt tapping
};

export const CROPS: CropProfile[] = [
  {
    id: "generic", name: "Any crop", note: "Crop-agnostic thresholds.",
    dryDays: 10, rain30Min: 100, rootDry: 0.35, rootWet: 0.9, heavyRain: 60, heatMax: 35,
    disease: "fungal leaf diseases", lowSun: 12, windMax: 6,
  },
  {
    id: "oil-palm", name: "Oil palm", note: "Needs ~150 mm rain a month. Dry spells show up as lower yield 6–24 months later.",
    dryDays: 14, rain30Min: 150, rootDry: 0.4, rootWet: 0.92, heavyRain: 80, heatMax: 35,
    disease: null, lowSun: 13, windMax: null,
  },
  {
    id: "padi", name: "Paddy (padi)", note: "Most sensitive at flowering and grain fill.",
    dryDays: 5, rain30Min: 150, rootDry: 0.5, rootWet: null, heavyRain: 80, heatMax: 35,
    disease: "rice blast and sheath blight", lowSun: 14, windMax: 5,
  },
  {
    id: "durian", name: "Durian / fruit", note: "A 1–2 week dry spell can trigger flowering. Heavy rain at flowering causes flower and fruit drop.",
    dryDays: 21, rain30Min: 100, rootDry: 0.35, rootWet: 0.88, heavyRain: 50, heatMax: 36,
    disease: "Phytophthora patch canker and root rot", lowSun: null, windMax: 6,
  },
  {
    id: "rubber", name: "Rubber", note: "Rain disrupts tapping and washes out latex.",
    dryDays: 21, rain30Min: 100, rootDry: 0.35, rootWet: null, heavyRain: 80, heatMax: 36,
    disease: "abnormal leaf fall (Phytophthora, Colletotrichum)", lowSun: null, windMax: 6, tapping: true,
  },
  {
    id: "cocoa", name: "Cocoa", note: "Shade crop. Sensitive to drought, wind and wet pods.",
    dryDays: 10, rain30Min: 100, rootDry: 0.4, rootWet: 0.9, heavyRain: 60, heatMax: 33,
    disease: "black pod (Phytophthora)", lowSun: null, windMax: 5,
  },
  {
    id: "banana", name: "Banana", note: "Shallow roots. Topples in strong wind.",
    dryDays: 7, rain30Min: 100, rootDry: 0.45, rootWet: 0.9, heavyRain: 60, heatMax: 35,
    disease: "Sigatoka leaf spot", lowSun: null, windMax: 5,
  },
  {
    id: "vegetables", name: "Leafy vegetables", note: "Short cycle. Needs steady moisture and dislikes heat.",
    dryDays: 3, rain30Min: 80, rootDry: 0.45, rootWet: 0.88, heavyRain: 40, heatMax: 32,
    disease: "downy mildew and leaf rot", lowSun: null, windMax: null,
  },
];

export type AlertLevel = "warning" | "watch";

export type CropAlert = {
  id: string;
  level: AlertLevel;
  title: string;
  detail: string;
  action: string;
  param: PowerParam;
  asOf: string | null; // ISO date of the last day the rule could see
};

const sum = (a: number[]) => a.reduce((s, v) => s + v, 0);
const mean = (a: number[]) => (a.length ? sum(a) / a.length : NaN);
const f1 = (n: number) => n.toFixed(1);

function asOf(d: PowerData, id: PowerParam) {
  const i = d.lastValid[id];
  return i >= 0 ? d.dates[i] : null;
}

/** Trailing run of days (ending at the last valid day) that satisfy `test`. */
function trailingRun(vals: number[], test: (v: number) => boolean) {
  let n = 0;
  for (let i = vals.length - 1; i >= 0 && test(vals[i]); i--) n++;
  return n;
}

function longestRun(flags: boolean[]) {
  let best = 0, cur = 0;
  for (const f of flags) { cur = f ? cur + 1 : 0; best = Math.max(best, cur); }
  return best;
}

export function evaluate(crop: CropProfile, d: PowerData): CropAlert[] {
  const out: CropAlert[] = [];
  const add = (a: Omit<CropAlert, "asOf">) => out.push({ ...a, asOf: asOf(d, a.param) });

  // --- Dry spell & monthly rain
  const rain60 = lastN(d, "PRECTOTCORR", 60);
  if (rain60.length >= 7) {
    const dry = trailingRun(rain60, (v) => v < 1);
    if (dry >= crop.dryDays) {
      add({ id: "dry-spell", level: "warning", param: "PRECTOTCORR",
        title: `Dry spell: ${dry} days without real rain`,
        detail: `${crop.name} is stressed after about ${crop.dryDays} dry days.`,
        action: "Irrigate if you can, mulch, and hold off on fertiliser until the soil is moist." });
    } else if (dry >= Math.ceil(crop.dryDays * 0.6)) {
      add({ id: "dry-spell", level: "watch", param: "PRECTOTCORR",
        title: `${dry} dry days in a row`,
        detail: `This becomes a stress risk at about ${crop.dryDays} days.`,
        action: "Check soil moisture and get irrigation ready." });
    }
  }
  const rain30 = lastN(d, "PRECTOTCORR", 30);
  if (rain30.length >= 25) {
    const total = sum(rain30);
    if (total < crop.rain30Min) {
      add({ id: "rain-30", level: total < crop.rain30Min / 2 ? "warning" : "watch", param: "PRECTOTCORR",
        title: `Only ${Math.round(total)} mm of rain in 30 days`,
        detail: `${crop.name} needs about ${crop.rain30Min} mm a month.`,
        action: "Plan supplementary irrigation and watch for moisture stress." });
    }
  }

  // --- Root-zone soil moisture
  const root7 = lastN(d, "GWETROOT", 7);
  if (root7.length >= 3) {
    const m = mean(root7);
    if (m < crop.rootDry) {
      add({ id: "root-dry", level: "warning", param: "GWETROOT",
        title: `Root-zone soil is dry (${m.toFixed(2)})`,
        detail: `The 7-day average is below ${crop.rootDry} for ${crop.name.toLowerCase()}.`,
        action: "Irrigate the root zone. Young plants and recent transplants come first." });
    } else if (m < crop.rootDry + 0.05) {
      add({ id: "root-dry", level: "watch", param: "GWETROOT",
        title: `Root-zone soil is drying (${m.toFixed(2)})`,
        detail: `It is close to the ${crop.rootDry} stress level.`,
        action: "Watch for wilting leaves at midday." });
    }
    if (crop.rootWet !== null && m > crop.rootWet) {
      add({ id: "root-wet", level: "watch", param: "GWETROOT",
        title: `Soil is close to saturated (${m.toFixed(2)})`,
        detail: "Waterlogged roots get short of oxygen and root rot spreads.",
        action: "Clear drains and avoid heavy machinery on wet ground." });
    }
  }

  // --- Heavy rain / flooding
  const rain7 = lastN(d, "PRECTOTCORR", 7);
  if (rain7.length) {
    const maxDay = Math.max(...rain7);
    let max3 = 0;
    for (let i = 0; i + 3 <= rain7.length; i++) max3 = Math.max(max3, sum(rain7.slice(i, i + 3)));
    if (maxDay >= crop.heavyRain || max3 >= crop.heavyRain * 2) {
      add({ id: "heavy-rain", level: "warning", param: "PRECTOTCORR",
        title: `Heavy rain: ${Math.round(maxDay)} mm in one day`,
        detail: `${Math.round(max3)} mm fell over 3 days in the past week.${crop.id === "durian" ? " Flowers and young fruit may drop." : ""}`,
        action: "Check drainage and low spots for flooding. Look for erosion and fertiliser wash-off." });
    }
  }

  // --- Heat stress
  const tmax7 = lastN(d, "T2M_MAX", 7);
  if (tmax7.length) {
    const hot = tmax7.filter((v) => v >= crop.heatMax).length;
    if (hot >= 1) {
      add({ id: "heat", level: hot >= 3 ? "warning" : "watch", param: "T2M_MAX",
        title: `Heat stress: ${hot} day${hot > 1 ? "s" : ""} at ${crop.heatMax} °C or more`,
        detail: `The hottest day reached ${f1(Math.max(...tmax7))} °C.${crop.id === "padi" ? " Heat at flowering causes empty grains." : ""}`,
        action: "Water early in the morning. Avoid spraying or transplanting in the midday heat." });
    }
  }

  // --- Disease-favouring weather. POWER gives daily means on a coarse grid, so RH >= 90%
  // almost never shows up. "Humid (>= 85%) + rainy (>= 1 mm) + 20-30 °C" stands in for long leaf wetness.
  if (crop.disease) {
    const rh = lastN(d, "RH2M", 14);
    const t = lastN(d, "T2M", 14);
    const r = lastN(d, "PRECTOTCORR", 14);
    const n = Math.min(rh.length, t.length, r.length);
    if (n >= 3) {
      const [rhN, tN, rN] = [rh.slice(-n), t.slice(-n), r.slice(-n)];
      const run = longestRun(rhN.map((h, i) => h >= 85 && rN[i] >= 1 && tN[i] >= 20 && tN[i] <= 30));
      if (run >= 3) {
        add({ id: "disease", level: run >= 5 ? "warning" : "watch", param: "RH2M",
          title: `Disease weather: ${run} humid, rainy days in a row`,
          detail: `Leaves that stay wet in mild temperatures favour ${crop.disease}.`,
          action: "Scout for early symptoms, improve airflow and drainage, and time protective sprays before more wet days." });
      }
    }
  }

  // --- Low sunlight
  if (crop.lowSun !== null) {
    const sun = lastN(d, "ALLSKY_SFC_SW_DWN", 7);
    if (sun.length >= 4 && mean(sun) < crop.lowSun) {
      add({ id: "low-sun", level: "watch", param: "ALLSKY_SFC_SW_DWN",
        title: `Low sunlight (${f1(mean(sun))} MJ/m² a day)`,
        detail: `Below about ${crop.lowSun} MJ/m² a day, growth${crop.id === "padi" ? " and grain filling" : ""} slow down.`,
        action: "Expect slower growth. Avoid extra nitrogen while the weather stays cloudy." });
    }
  }

  // --- Wind
  if (crop.windMax !== null) {
    const wind = lastN(d, "WS2M", 7);
    if (wind.length && Math.max(...wind) >= crop.windMax) {
      add({ id: "wind", level: "watch", param: "WS2M",
        title: `Windy: a daily average up to ${f1(Math.max(...wind))} m/s`,
        detail: crop.id === "padi" ? "Strong wind can flatten (lodge) ripening padi." : "Strong wind can topple or break plants.",
        action: "Prop up tall plants and check windbreaks." });
    }
  }

  // --- Rubber tapping days
  if (crop.tapping) {
    const r14 = lastN(d, "PRECTOTCORR", 14);
    if (r14.length >= 10) {
      const wet = r14.filter((v) => v >= 2).length;
      if (wet >= 7) {
        add({ id: "tapping", level: wet >= 10 ? "warning" : "watch", param: "PRECTOTCORR",
          title: `${wet} of the last ${r14.length} days were wet`,
          detail: "Wet bark makes for lost tapping days and latex wash-out.",
          action: "Use rain guards, and tap later in the morning once the bark is dry." });
      }
    }
  }

  return out.sort((a, b) => (a.level === b.level ? 0 : a.level === "warning" ? -1 : 1));
}
