"use client";

import { useEffect, useMemo, useState } from "react";
import { CROPS, evaluate, type CropAlert } from "../lib/cropRules";
import { fetchPowerDaily, lastN, toCsv, type PowerData, type PowerParam } from "../lib/power";
import type { FieldLocation } from "./FieldMap";
import DailyChart from "./DailyChart";
import AiAdvisor from "./AiAdvisor";

const RANGES = [30, 90] as const;
const CROP_KEY = "power-panel-crop";
const FETCH_DAYS = 90;

type Result = { key: string; data?: PowerData; error?: string };

const fmtDate = (iso: string | null) =>
  iso
    ? new Date(iso + "T00:00:00Z").toLocaleDateString(undefined, { day: "numeric", month: "short", timeZone: "UTC" })
    : "–";

const fmt = (v: number | null | undefined, digits = 1) => (v === null || v === undefined ? "–" : v.toFixed(digits));

function latest(d: PowerData, id: PowerParam) {
  const i = d.lastValid[id];
  return { value: i >= 0 ? d.series[id][i] : null, date: i >= 0 ? d.dates[i] : null };
}

export default function PowerPanel({ location }: { location: FieldLocation | null }) {
  const [today, setToday] = useState<Date | null>(null);
  const [days, setDays] = useState<(typeof RANGES)[number]>(90);
  const [cropId, setCropId] = useState(CROPS[0].id);
  const [result, setResult] = useState<Result | null>(null);

  // Clock and the remembered crop are read after mount (cacheComponents forbids them during prerender).
  useEffect(() => {
    /* eslint-disable react-hooks/set-state-in-effect */
    setToday(new Date());
    try {
      const saved = localStorage.getItem(CROP_KEY);
      if (saved && CROPS.some((c) => c.id === saved)) setCropId(saved);
    } catch {}
    /* eslint-enable react-hooks/set-state-in-effect */
  }, []);

  const key = location && today ? `${location.lng.toFixed(2)},${location.lat.toFixed(2)}` : null;

  useEffect(() => {
    if (!location || !today || !key) return;
    const ctrl = new AbortController();
    // Always fetch the longest range; the chart slices it, and the rules get a full window.
    fetchPowerDaily(location.lng, location.lat, FETCH_DAYS, today, ctrl.signal)
      .then((data) => setResult({ key, data }))
      .catch((e: unknown) => {
        if (ctrl.signal.aborted) return;
        setResult({ key, error: e instanceof Error ? e.message : "Couldn't reach NASA POWER." });
      });
    return () => ctrl.abort();
  }, [key, location, today]);

  const crop = CROPS.find((c) => c.id === cropId) ?? CROPS[0];
  const current = result && result.key === key ? result : null;
  const loading = !!key && !current;
  const full = current?.data;

  // The chart shows only the selected range (the fetch may be longer for the rules).
  const view = useMemo(() => {
    if (!full) return null;
    const from = Math.max(0, full.dates.length - days);
    const series = Object.fromEntries(
      Object.entries(full.series).map(([k, v]) => [k, v.slice(from)]),
    ) as PowerData["series"];
    return { dates: full.dates.slice(from), series };
  }, [full, days]);

  const alerts: CropAlert[] = useMemo(() => (full ? evaluate(crop, full) : []), [full, crop]);

  function chooseCrop(id: string) {
    setCropId(id);
    try { localStorage.setItem(CROP_KEY, id); } catch {}
  }

  function downloadCsv() {
    if (!full) return;
    const blob = new Blob([toCsv(full)], { type: "text/csv" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `nasa-power_${full.lat}_${full.lng}_${full.dates[0]}_${full.dates.at(-1)}.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
  }

  return (
    <section aria-label="Weather and crop alerts" className="flex flex-col gap-4 p-4 text-sm text-zinc-900 dark:text-zinc-50">
      <header className="flex flex-col gap-1">
        <h2 className="font-display text-2xl tracking-wide">Field weather &amp; crop alerts</h2>
        {location ? (
          <p className="text-zinc-600 dark:text-zinc-300">
            {location.lat.toFixed(3)}°, {location.lng.toFixed(3)}°
            {full?.elevation != null && ` · ${Math.round(full.elevation)} m above sea level`}
          </p>
        ) : (
          <p className="text-zinc-600 dark:text-zinc-300">
            Tap your field on the map, or pick a demo farm, to see the last {days} days of NASA weather and soil data.
          </p>
        )}
      </header>

      <div className="flex flex-col gap-2">
        <div className="flex flex-wrap gap-2" role="group" aria-label="Crop">
          {CROPS.map((c) => (
            <button key={c.id} type="button" aria-pressed={c.id === cropId} onClick={() => chooseCrop(c.id)}
              className={`rounded-full border px-3 py-1 ${c.id === cropId
                ? "border-emerald-600 bg-emerald-100 text-emerald-900 dark:bg-emerald-900 dark:text-emerald-50"
                : "border-zinc-300 dark:border-zinc-600"}`}>
              {c.name}
            </button>
          ))}
        </div>
        <p className="text-zinc-500 dark:text-zinc-400">{crop.note}</p>
      </div>

      {loading && <p aria-live="polite" className="animate-pulse text-zinc-500">Loading NASA POWER data…</p>}
      {current?.error && (
        <p role="alert" className="rounded-md bg-red-50 px-3 py-2 text-red-900 dark:bg-red-950 dark:text-red-100">
          {current.error}
        </p>
      )}

      {full && view && (
        <>
          <div className="grid grid-cols-2 gap-2">
            <Kpi label="Air temp" value={`${fmt(latest(full, "T2M").value)} °C`}
              sub={`${fmt(latest(full, "T2M_MIN").value, 0)}–${fmt(latest(full, "T2M_MAX").value, 0)} °C`}
              date={latest(full, "T2M").date} />
            <Kpi label="Rain, last 7 days" value={`${Math.round(lastN(full, "PRECTOTCORR", 7).reduce((s, v) => s + v, 0))} mm`}
              sub={`${Math.round(lastN(full, "PRECTOTCORR", 30).reduce((s, v) => s + v, 0))} mm over 30 days`}
              date={latest(full, "PRECTOTCORR").date} />
            <Kpi label="Root-zone soil" value={fmt(latest(full, "GWETROOT").value, 2)}
              sub={`topsoil ${fmt(latest(full, "GWETTOP").value, 2)} (0 dry – 1 wet)`}
              date={latest(full, "GWETROOT").date} />
            <Kpi label="Humidity" value={`${fmt(latest(full, "RH2M").value, 0)} %`}
              sub={`wind ${fmt(latest(full, "WS2M").value)} m/s`}
              date={latest(full, "RH2M").date} />
          </div>

          <div className="flex flex-col gap-2">
            <h3 className="font-medium">Alerts for {crop.name.toLowerCase()}</h3>
            {alerts.length === 0 ? (
              <p className="rounded-md border border-zinc-200 px-3 py-2 dark:border-zinc-700">
                <span aria-hidden="true" className="mr-1 text-[#0ca30c]">✓</span>
                No stress signals in the recent data.
              </p>
            ) : (
              <ul className="flex flex-col gap-2">
                {alerts.map((a) => <AlertCard key={a.id} a={a} />)}
              </ul>
            )}
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Rules of thumb based on the past days&apos; weather. This is not a forecast and not agronomic advice.
            </p>
          </div>

          <AiAdvisor key={`${key}|${crop.id}`} lat={full.lat} lng={full.lng} cropId={crop.id} cropName={crop.name} />

          <div className="flex items-center justify-between gap-2">
            <div className="flex gap-1" role="group" aria-label="Chart range">
              {RANGES.map((r) => (
                <button key={r} type="button" aria-pressed={r === days} onClick={() => setDays(r)}
                  className={`rounded-md border px-2 py-0.5 ${r === days
                    ? "border-zinc-900 bg-zinc-900 text-white dark:border-zinc-100 dark:bg-zinc-100 dark:text-zinc-900"
                    : "border-zinc-300 dark:border-zinc-600"}`}>
                  {r} days
                </button>
              ))}
            </div>
            <button type="button" onClick={downloadCsv} className="rounded-md border border-zinc-300 px-2 py-0.5 dark:border-zinc-600">
              Download CSV
            </button>
          </div>

          <DailyChart title="Rain" subtitle="mm per day" dates={view.dates} color="var(--viz-rain)"
            bars={view.series.PRECTOTCORR}
            refs={[{ y: crop.heavyRain, label: `heavy rain ${crop.heavyRain} mm` }]}
            tooltip={(i) => [{ label: "Rain", value: view.series.PRECTOTCORR[i] === null ? "no data yet" : `${fmt(view.series.PRECTOTCORR[i])} mm` }]} />

          <DailyChart title="Temperature" subtitle="band = daily min–max, line = average, °C" dates={view.dates}
            color="var(--viz-temp)" line={view.series.T2M}
            band={{ lo: view.series.T2M_MIN, hi: view.series.T2M_MAX }}
            refs={[{ y: crop.heatMax, label: `heat stress ${crop.heatMax} °C` }]}
            tooltip={(i) => view.series.T2M[i] === null ? [{ label: "Temp", value: "no data yet" }] : [
              { label: "Max", value: `${fmt(view.series.T2M_MAX[i])} °C` },
              { label: "Average", value: `${fmt(view.series.T2M[i])} °C` },
              { label: "Min", value: `${fmt(view.series.T2M_MIN[i])} °C` },
            ]} />

          <DailyChart title="Root-zone soil wetness" subtitle="0 = dry, 1 = saturated" dates={view.dates}
            color="var(--viz-soil)" line={view.series.GWETROOT} yDomain={[0, 1]}
            refs={[
              { y: crop.rootDry, label: "drought stress" },
              ...(crop.rootWet !== null ? [{ y: crop.rootWet, label: "waterlogging" }] : []),
            ]}
            tooltip={(i) => [
              { label: "Root zone", value: fmt(view.series.GWETROOT[i], 2) },
              { label: "Topsoil", value: fmt(view.series.GWETTOP[i], 2) },
            ]} />

          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            Source: NASA POWER daily point API (community AG), on a grid about 50 km wide, so the values describe the
            surrounding area, not one field. The latest 2–4 days are often still being processed.
          </p>
        </>
      )}
    </section>
  );
}

function Kpi({ label, value, sub, date }: { label: string; value: string; sub: string; date: string | null }) {
  return (
    <div className="flex flex-col rounded-lg border border-zinc-200 p-2 dark:border-zinc-700">
      <span className="text-xs text-zinc-500 dark:text-zinc-400">{label}</span>
      <span className="text-lg font-semibold tabular-nums">{value}</span>
      <span className="text-xs text-zinc-600 dark:text-zinc-300">{sub}</span>
      <span className="text-xs text-zinc-500 dark:text-zinc-400">as of {fmtDate(date)}</span>
    </div>
  );
}

function AlertCard({ a }: { a: CropAlert }) {
  const warn = a.level === "warning";
  return (
    <li className="flex gap-2 rounded-lg border border-zinc-200 p-2 dark:border-zinc-700"
      style={{ borderLeft: `4px solid var(${warn ? "--status-critical" : "--status-warning"})` }}>
      <span aria-hidden="true" className="text-base leading-5">{warn ? "⚠️" : "👀"}</span>
      <div className="flex flex-col gap-0.5">
        <span className="font-medium">
          <span className="mr-1 text-xs uppercase tracking-wide text-zinc-500 dark:text-zinc-400">{warn ? "Warning" : "Watch"}</span>
          {a.title}
        </span>
        <span className="text-zinc-600 dark:text-zinc-300">{a.detail}</span>
        <span className="text-zinc-800 dark:text-zinc-100">→ {a.action}</span>
        <span className="text-xs text-zinc-500 dark:text-zinc-400">Data up to {fmtDate(a.asOf)}</span>
      </div>
    </li>
  );
}
