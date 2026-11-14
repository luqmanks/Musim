import type { ClimateSummary, MonthlyClimate } from "../../../lib/field-shift";
import { fetchPowerRange, type PowerData, type PowerParam } from "../../../lib/power";

const MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

function demoClimate(): ClimateSummary {
  const rain = [42, 49, 92, 158, 188, 121, 111, 135, 184, 254, 273, 142];
  const temp = [27.0, 27.5, 28.1, 28.5, 28.2, 27.8, 27.5, 27.4, 27.2, 27.0, 26.8, 26.8];
  const monthly = MONTHS.map((label, index) => ({
    month: index + 1,
    label,
    rainMm: rain[index],
    tempC: temp[index],
    maxTempC: temp[index] + 4.2,
    humidity: 79 + (rain[index] > 180 ? 4 : 0),
    solar: 4.7,
  }));
  return summarise(monthly, true);
}

function summarise(
  monthly: MonthlyClimate[],
  isFallback: boolean,
): ClimateSummary {
  const hottest = monthly.reduce((a, b) =>
    a.maxTempC > b.maxTempC ? a : b,
  );
  const wettest = monthly.reduce((a, b) => (a.rainMm > b.rainMm ? a : b));
  return {
    source: isFallback ? "Demonstration climatology" : "NASA POWER",
    sourceUrl: "https://power.larc.nasa.gov/",
    period: "2021–2025",
    resolution: "NASA POWER meteorology grid: 0.5° × 0.625°",
    retrievedAt: new Date().toISOString(),
    isFallback,
    annualRainMm: monthly.reduce((sum, month) => sum + month.rainMm, 0),
    meanTempC:
      monthly.reduce((sum, month) => sum + month.tempC, 0) / monthly.length,
    hottestMonth: hottest.label,
    wettestMonth: wettest.label,
    dryMonths: monthly.filter((month) => month.rainMm < 100).length,
    monthly,
  };
}

/** Five-year daily series -> typical month (mean temperature/humidity/solar, mean rain total per year). */
function monthlyClimate(data: PowerData): MonthlyClimate[] {
  return MONTHS.map((label, monthIndex) => {
    const month = String(monthIndex + 1).padStart(2, "0");
    const idx = data.dates.flatMap((date, i) => (date.slice(5, 7) === month ? [i] : []));
    const values = (param: PowerParam) =>
      idx.map((i) => data.series[param][i]).filter((v): v is number => v !== null);
    const mean = (items: number[]) =>
      items.length ? items.reduce((sum, item) => sum + item, 0) / items.length : 0;
    const years = new Set(idx.map((i) => data.dates[i].slice(0, 4))).size || 1;
    return {
      month: monthIndex + 1,
      label,
      rainMm: values("PRECTOTCORR").reduce((sum, item) => sum + item, 0) / years,
      tempC: mean(values("T2M")),
      maxTempC: mean(values("T2M_MAX")),
      humidity: mean(values("RH2M")),
      solar: mean(values("ALLSKY_SFC_SW_DWN")),
    };
  });
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const lat = Number(searchParams.get("lat"));
  const lng = Number(searchParams.get("lng"));

  if (!Number.isFinite(lat) || !Number.isFinite(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) {
    return Response.json({ error: "Valid latitude and longitude are required." }, { status: 400 });
  }

  try {
    // Fetch + -999 handling come from the shared NASA POWER client (app/lib/power.ts).
    const data = await fetchPowerRange(lng, lat, "2021-01-01", "2025-12-31", {
      init: { next: { revalidate: 86_400 } },
    });
    const monthly = monthlyClimate(data);

    return Response.json(summarise(monthly, false));
  } catch (error) {
    const fallback = demoClimate();
    return Response.json({
      ...fallback,
      warning:
        error instanceof Error
          ? `Live NASA POWER unavailable: ${error.message}`
          : "Live NASA POWER unavailable.",
    });
  }
}

