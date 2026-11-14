// Turns the NASA POWER daily series into the climate profile used by the field comparison.
// Everything here is computed from the response: no demonstration numbers, no fixed period.

import type { ClimateSummary, MonthlyClimate, YearClimate } from "./field-shift";
import type { PowerData, PowerParam } from "./power";

export const MONTH_LABELS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

const mean = (a: number[]) => (a.length ? a.reduce((s, v) => s + v, 0) / a.length : NaN);
const daysIn = (year: number, month: number) => new Date(Date.UTC(year, month, 0)).getUTCDate();

/** Last five complete calendar years, relative to `now`. */
export function climatePeriod(now: Date) {
  const endYear = now.getUTCFullYear() - 1;
  return { startYear: endYear - 4, endYear };
}

function monthOf(data: PowerData, year: number, month: number): MonthlyClimate {
  const mm = String(month).padStart(2, "0");
  const idx = data.dates.flatMap((d, i) => (d.startsWith(`${year}-${mm}`) ? [i] : []));
  const vals = (id: PowerParam) => idx.map((i) => data.series[id][i]).filter((v): v is number => v !== null);
  // Month rain = mean of the valid days x days in the month, so a few missing days don't undercount.
  return {
    month,
    label: MONTH_LABELS[month - 1],
    rainMm: mean(vals("PRECTOTCORR")) * daysIn(year, month),
    tempC: mean(vals("T2M")),
    maxTempC: mean(vals("T2M_MAX")),
    humidity: mean(vals("RH2M")),
    solar: mean(vals("ALLSKY_SFC_SW_DWN")),
  };
}

const finite = (m: MonthlyClimate) =>
  [m.rainMm, m.tempC, m.maxTempC].every(Number.isFinite);

export function summariseClimate(data: PowerData): ClimateSummary {
  const yearNums = [...new Set(data.dates.map((d) => Number(d.slice(0, 4))))].sort();
  const years: YearClimate[] = yearNums
    .map((year) => {
      const monthly = Array.from({ length: 12 }, (_, i) => monthOf(data, year, i + 1));
      return {
        year,
        monthly,
        annualRainMm: monthly.reduce((s, m) => s + m.rainMm, 0),
        meanTempC: mean(monthly.map((m) => m.tempC)),
        complete: monthly.every(finite),
      };
    })
    .filter((y) => y.complete);
  if (!years.length) throw new Error("NASA POWER returned no complete year of data for this location.");

  // Typical year = mean of each month across the complete years.
  const monthly: MonthlyClimate[] = Array.from({ length: 12 }, (_, i) => {
    const at = years.map((y) => y.monthly[i]);
    return {
      month: i + 1,
      label: MONTH_LABELS[i],
      rainMm: mean(at.map((m) => m.rainMm)),
      tempC: mean(at.map((m) => m.tempC)),
      maxTempC: mean(at.map((m) => m.maxTempC)),
      humidity: mean(at.map((m) => m.humidity)),
      solar: mean(at.map((m) => m.solar)),
    };
  });

  const best = (key: (y: YearClimate) => number, dir: 1 | -1) =>
    years.reduce((a, b) => (dir * key(b) > dir * key(a) ? b : a)).year;

  const hottest = monthly.reduce((a, b) => (a.maxTempC > b.maxTempC ? a : b));
  const wettest = monthly.reduce((a, b) => (a.rainMm > b.rainMm ? a : b));
  const valid = (id: PowerParam) => data.series[id].filter((v) => v !== null).length;
  const coverage = Math.min(valid("PRECTOTCORR"), valid("T2M"), valid("T2M_MAX")) / Math.max(1, data.dates.length);
  const first = years[0].year;
  const last = years[years.length - 1].year;

  return {
    source: "NASA POWER",
    sourceUrl: "https://power.larc.nasa.gov/",
    period: first === last ? String(first) : `${first}–${last}`,
    resolution: [data.meta.title, data.meta.sources.length ? `sources: ${data.meta.sources.join(", ")}` : null]
      .filter(Boolean)
      .join(" · ") || "NASA POWER daily point grid",
    retrievedAt: new Date().toISOString(),
    annualRainMm: monthly.reduce((s, m) => s + m.rainMm, 0),
    meanTempC: mean(monthly.map((m) => m.tempC)),
    hottestMonth: hottest.label,
    wettestMonth: wettest.label,
    // Gaussen index: a month is dry when its rain (mm) is below twice its mean temperature (°C).
    dryMonths: monthly.filter((m) => m.rainMm < 2 * m.tempC).length,
    monthly,
    years,
    scenarioYears: {
      dry: best((y) => y.annualRainMm, -1),
      wet: best((y) => y.annualRainMm, 1),
      hotter: best((y) => y.meanTempC, 1),
    },
    coverage,
  };
}
