// NASA POWER daily single-point API (https://power.larc.nasa.gov/api/pages/).
//   GET https://power.larc.nasa.gov/api/temporal/daily/point
//       ?parameters=A,B,C&community=AG&longitude=<lng>&latitude=<lat>
//       &start=YYYYMMDD&end=YYYYMMDD&format=JSON
// CORS is open (access-control-allow-origin: *), so the browser calls it directly.
// Response: properties.parameter[PARAM][YYYYMMDD] = number; header.fill_value = -999.
// The newest 2-4 days are usually -999 (solar lags longest), so every series is nullable.
// The grid is coarse (~0.5 deg), so the numbers describe the area, not one field.

import { isoDaysBefore } from "./gibs";

export const POWER_ENDPOINT = "https://power.larc.nasa.gov/api/temporal/daily/point";

export const POWER_PARAMS = [
  { id: "T2M", label: "Air temperature", short: "Temp", unit: "°C", note: "Daily average, 2 m above ground." },
  { id: "T2M_MAX", label: "Max temperature", short: "Max", unit: "°C", note: "Hottest hour of the day." },
  { id: "T2M_MIN", label: "Min temperature", short: "Min", unit: "°C", note: "Coolest hour, usually at night." },
  { id: "PRECTOTCORR", label: "Rain", short: "Rain", unit: "mm", note: "Total rain for the day." },
  { id: "RH2M", label: "Humidity", short: "RH", unit: "%", note: "Daily average relative humidity." },
  { id: "WS2M", label: "Wind", short: "Wind", unit: "m/s", note: "Daily average wind 2 m above ground." },
  { id: "ALLSKY_SFC_SW_DWN", label: "Sunlight", short: "Sun", unit: "MJ/m²", note: "Solar energy reaching the ground." },
  { id: "GWETROOT", label: "Root-zone soil wetness", short: "Root soil", unit: "0–1", note: "0 = bone dry, 1 = fully soaked." },
  { id: "GWETTOP", label: "Topsoil wetness", short: "Topsoil", unit: "0–1", note: "Top ~5 cm of soil." },
] as const;

export type PowerParam = (typeof POWER_PARAMS)[number]["id"];

export type PowerData = {
  lng: number;
  lat: number;
  elevation: number | null;
  meta: { title: string | null; sources: string[] }; // from the NASA response header
  dates: string[]; // ISO YYYY-MM-DD, oldest first
  series: Record<PowerParam, (number | null)[]>;
  lastValid: Record<PowerParam, number>; // index into dates, -1 if none
};

const round2 = (n: number) => Math.round(n * 100) / 100;
const compact = (iso: string) => iso.replaceAll("-", "");

export function powerUrl(lng: number, lat: number, startIso: string, endIso: string): string {
  const q = new URLSearchParams({
    parameters: POWER_PARAMS.map((p) => p.id).join(","),
    community: "AG",
    longitude: String(round2(lng)),
    latitude: String(round2(lat)),
    start: compact(startIso),
    end: compact(endIso),
    format: "JSON",
  });
  return `${POWER_ENDPOINT}?${q}`;
}

type RawResponse = {
  geometry?: { coordinates?: number[] };
  header?: { fill_value?: number; title?: string; sources?: string[] };
  properties?: { parameter?: Record<string, Record<string, number>> };
  messages?: string[];
};

export function parsePower(raw: RawResponse, lng: number, lat: number): PowerData {
  const fill = raw.header?.fill_value ?? -999;
  const params = raw.properties?.parameter ?? {};
  const keys = Object.keys(params[POWER_PARAMS[0].id] ?? {}).sort();
  const dates = keys.map((k) => `${k.slice(0, 4)}-${k.slice(4, 6)}-${k.slice(6, 8)}`);
  const series = {} as PowerData["series"];
  const lastValid = {} as PowerData["lastValid"];
  for (const { id } of POWER_PARAMS) {
    const col = params[id] ?? {};
    const vals = keys.map((k) => {
      const v = col[k];
      return typeof v === "number" && v !== fill && Number.isFinite(v) ? v : null;
    });
    series[id] = vals;
    let last = -1;
    for (let i = vals.length - 1; i >= 0; i--) if (vals[i] !== null) { last = i; break; }
    lastValid[id] = last;
  }
  const elev = raw.geometry?.coordinates?.[2];
  const meta = { title: raw.header?.title ?? null, sources: raw.header?.sources ?? [] };
  return { lng, lat, elevation: typeof elev === "number" ? elev : null, meta, dates, series, lastValid };
}

const cache = new Map<string, PowerData>();
const CACHE_MAX = 64;

/**
 * Fetch any date range (ISO dates, inclusive). Used by the 90-day crop check and by the
 * five-year climate profile behind /api/nasa/power. `init` is passed to fetch, e.g.
 * `{ next: { revalidate: 86_400 } }` on the server.
 */
export async function fetchPowerRange(
  lng: number,
  lat: number,
  startIso: string,
  endIso: string,
  opts: { signal?: AbortSignal; init?: RequestInit } = {},
): Promise<PowerData> {
  const url = powerUrl(lng, lat, startIso, endIso);
  const hit = cache.get(url);
  if (hit) return hit;
  const res = await fetch(url, { ...opts.init, signal: opts.signal });
  if (!res.ok) {
    let msg = `NASA POWER returned ${res.status}`;
    try {
      const body = await res.json();
      if (Array.isArray(body?.messages) && body.messages.length) msg += `: ${body.messages.join(" ")}`;
    } catch {}
    throw new Error(msg);
  }
  const data = parsePower(await res.json(), round2(lng), round2(lat));
  if (!data.dates.length) throw new Error("NASA POWER response did not include parameters");
  if (cache.size >= CACHE_MAX) cache.delete(cache.keys().next().value!);
  cache.set(url, data);
  return data;
}

/** Fetch the last `days` days ending today (the newest days come back as null). */
export function fetchPowerDaily(
  lng: number,
  lat: number,
  days: number,
  today: Date,
  signal?: AbortSignal,
): Promise<PowerData> {
  return fetchPowerRange(lng, lat, isoDaysBefore(today, days - 1), isoDaysBefore(today, 0), { signal });
}

/** Values from the last `n` days that have data (skips the trailing null lag). */
export function lastN(data: PowerData, id: PowerParam, n: number): number[] {
  const end = data.lastValid[id];
  if (end < 0) return [];
  return data.series[id].slice(Math.max(0, end - n + 1), end + 1).filter((v): v is number => v !== null);
}

export function toCsv(data: PowerData): string {
  const head = ["date", ...POWER_PARAMS.map((p) => `${p.id} (${p.unit})`)];
  const rows = data.dates.map((d, i) => [d, ...POWER_PARAMS.map((p) => data.series[p.id][i] ?? "")]);
  return [head, ...rows].map((r) => r.join(",")).join("\n");
}
