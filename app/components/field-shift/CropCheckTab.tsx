"use client";

// "Crop check" results tab: the last 90 days from the NASA POWER daily point API,
// this branch's crop stress rules for every crop, and the Gemini field advisor.

import { useEffect, useMemo, useState } from "react";
import { CROPS, evaluate, type CropAlert, type CropProfile } from "../../lib/cropRules";
import type { FarmProfile, FieldLocation } from "../../lib/field-shift";
import { fetchPowerDaily, lastN, toCsv, type PowerData, type PowerParam } from "../../lib/power";
import AiAdvisor from "../AiAdvisor";
import DailyChart from "../DailyChart";

const FETCH_DAYS = 90;
const RANGES = [30, 90] as const;

type Verdict = "good" | "watch" | "warning";
const VERDICT_LABEL: Record<Verdict, string> = {
  good: "Conditions suit it now",
  watch: "Plant with care",
  warning: "Not advised right now",
};
const VERDICT_RANK: Record<Verdict, number> = { good: 0, watch: 1, warning: 2 };

type Result = { key: string; data?: PowerData; error?: string };

const fmtDate = (iso: string | null) =>
  iso ? new Date(iso + "T00:00:00Z").toLocaleDateString(undefined, { day: "numeric", month: "short", timeZone: "UTC" }) : "–";
const fmt = (v: number | null | undefined, digits = 1) => (v === null || v === undefined ? "–" : v.toFixed(digits));
const total = (a: number[]) => a.reduce((s, v) => s + v, 0);

function latest(d: PowerData, id: PowerParam) {
  const i = d.lastValid[id];
  return { value: i >= 0 ? d.series[id][i] : null, date: i >= 0 ? d.dates[i] : null };
}

function verdictFor(alerts: CropAlert[]): Verdict {
  if (alerts.some((a) => a.level === "warning")) return "warning";
  return alerts.length ? "watch" : "good";
}

export function CropCheckTab({ location, profile }: { location: FieldLocation; profile: FarmProfile }) {
  const [today, setToday] = useState<Date | null>(null);
  const [result, setResult] = useState<Result | null>(null);
  const [days, setDays] = useState<(typeof RANGES)[number]>(90);
  const [advisorCrop, setAdvisorCrop] = useState(profile.rotation.includes("paddy") ? "padi" : "generic");

  // Read the clock after mount (cacheComponents forbids new Date() during prerender).
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setToday(new Date());
  }, []);

  const key = today ? `${location.lng.toFixed(2)},${location.lat.toFixed(2)}` : null;

  useEffect(() => {
    if (!today || !key) return;
    const ctrl = new AbortController();
    fetchPowerDaily(location.lng, location.lat, FETCH_DAYS, today, ctrl.signal)
      .then((data) => setResult({ key, data }))
      .catch((e: unknown) => {
        if (!ctrl.signal.aborted) setResult({ key, error: e instanceof Error ? e.message : "Couldn't reach NASA POWER." });
      });
    return () => ctrl.abort();
  }, [key, location.lat, location.lng, today]);

  const current = result && result.key === key ? result : null;
  const data = current?.data;

  const ranking = useMemo(() => {
    if (!data) return [];
    return CROPS.filter((c) => c.id !== "generic")
      .map((crop) => {
        const alerts = evaluate(crop, data);
        return { crop, alerts, verdict: verdictFor(alerts) };
      })
      .sort((a, b) => VERDICT_RANK[a.verdict] - VERDICT_RANK[b.verdict] || a.alerts.length - b.alerts.length);
  }, [data]);

  const view = useMemo(() => {
    if (!data) return null;
    const from = Math.max(0, data.dates.length - days);
    const series = Object.fromEntries(Object.entries(data.series).map(([k, v]) => [k, v.slice(from)])) as PowerData["series"];
    return { dates: data.dates.slice(from), series };
  }, [data, days]);

  const chartCrop: CropProfile = CROPS.find((c) => c.id === advisorCrop) ?? CROPS[0];

  function downloadCsv() {
    if (!data) return;
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([toCsv(data)], { type: "text/csv" }));
    a.download = `nasa-power_${data.lat}_${data.lng}_${data.dates[0]}_${data.dates.at(-1)}.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
  }

  if (!current) {
    return (
      <div className="loading-state" role="status">
        <span className="loading-orbit" /><h2>Checking recent weather</h2><p>Loading the last {FETCH_DAYS} days from NASA POWER…</p>
      </div>
    );
  }

  if (current.error || !data || !view) {
    return (
      <div className="data-warning" role="alert">
        <strong>Recent NASA POWER data unavailable</strong>
        <span>{current.error ?? "No data returned."} The rotation comparison still works from the five-year profile.</span>
      </div>
    );
  }

  const good = ranking.filter((r) => r.verdict === "good").map((r) => r.crop.name);

  return (
    <div id="crops-panel" className="crop-check-view" role="tabpanel" aria-labelledby="crops-tab">
      <div className="crop-check-col">
        <section className="crop-check-card" aria-labelledby="suit-title">
          <div className="section-heading compact">
            <div>
              <h3 id="suit-title">Which crops suit this field right now?</h3>
              <p>Each crop is checked against the last {FETCH_DAYS} days of NASA weather and soil data.</p>
            </div>
            <span className="source-chip">NASA POWER</span>
          </div>
          <ul className="suit-list">
            {ranking.map(({ crop, alerts, verdict }) => (
              <li key={crop.id}>
                <details className={`suit-item ${verdict}`}>
                  <summary>
                    <span>
                      <strong>{crop.name}</strong>
                      <small>{alerts.length ? alerts.map((a) => a.title).slice(0, 2).join(" · ") : "No stress signals in recent data"}</small>
                    </span>
                    <span className="suit-badge"><i aria-hidden="true" />{VERDICT_LABEL[verdict]}</span>
                  </summary>
                  <div className="suit-body">
                    <p>{crop.note}</p>
                    {alerts.map((a) => (
                      <div key={a.id} className="suit-alert">
                        <strong>{a.level === "warning" ? "Warning" : "Watch"}: {a.title}</strong>
                        <span>{a.detail}</span>
                        <em>→ {a.action}</em>
                        <small>Data up to {fmtDate(a.asOf)}</small>
                      </div>
                    ))}
                    <button type="button" className="edit-button" onClick={() => setAdvisorCrop(crop.id)}>
                      Ask the advisor about {crop.name.toLowerCase()}
                    </button>
                  </div>
                </details>
              </li>
            ))}
          </ul>
        </section>
        <div className="insight-callout">
          <span aria-hidden="true">↳</span>
          <p>
            <strong>{good.length ? `Recent conditions suit ${good.join(", ")}.` : "Every crop shows at least one stress signal right now."}</strong>{" "}
            This reflects the past {FETCH_DAYS} days, not a forecast. Combine it with the rotation options and the season rhythm.
          </p>
        </div>
        <AiAdvisor lat={location.lat} lng={location.lng} cropId={advisorCrop} onCropChange={setAdvisorCrop} profile={profile} />
      </div>

      <div className="crop-check-col">
        <section className="crop-check-card" aria-labelledby="recent-title">
          <div className="section-heading compact">
            <div>
              <h3 id="recent-title">Recent field weather</h3>
              <p>Daily NASA POWER values. The newest 2–4 days are often still being processed.</p>
            </div>
            <div className="range-toggle" role="group" aria-label="Chart range">
              {RANGES.map((r) => (
                <button key={r} type="button" aria-pressed={r === days} onClick={() => setDays(r)}>{r} days</button>
              ))}
            </div>
          </div>
          <div className="metric-row compact">
            <div><span>Air temperature</span><strong>{fmt(latest(data, "T2M").value)} <small>°C</small></strong><em>as of {fmtDate(latest(data, "T2M").date)}</em></div>
            <div><span>Rain, last 7 days</span><strong>{Math.round(total(lastN(data, "PRECTOTCORR", 7)))} <small>mm</small></strong><em>{Math.round(total(lastN(data, "PRECTOTCORR", 30)))} mm over 30 days</em></div>
            <div><span>Root-zone soil</span><strong>{fmt(latest(data, "GWETROOT").value, 2)}</strong><em>0 dry – 1 saturated</em></div>
            <div><span>Humidity</span><strong>{fmt(latest(data, "RH2M").value, 0)} <small>%</small></strong><em>wind {fmt(latest(data, "WS2M").value)} m/s</em></div>
          </div>
          <DailyChart title="Rain" subtitle="mm per day" dates={view.dates} color="var(--viz-rain)"
            bars={view.series.PRECTOTCORR}
            refs={[{ y: chartCrop.heavyRain, label: `heavy rain for ${chartCrop.name.toLowerCase()}` }]}
            tooltip={(i) => [{ label: "Rain", value: view.series.PRECTOTCORR[i] === null ? "no data yet" : `${fmt(view.series.PRECTOTCORR[i])} mm` }]} />
          <DailyChart title="Temperature" subtitle="band = daily min–max, line = average, °C" dates={view.dates}
            color="var(--viz-temp)" line={view.series.T2M} band={{ lo: view.series.T2M_MIN, hi: view.series.T2M_MAX }}
            refs={[{ y: chartCrop.heatMax, label: `heat stress ${chartCrop.heatMax} °C` }]}
            tooltip={(i) => view.series.T2M[i] === null ? [{ label: "Temp", value: "no data yet" }] : [
              { label: "Max", value: `${fmt(view.series.T2M_MAX[i])} °C` },
              { label: "Average", value: `${fmt(view.series.T2M[i])} °C` },
              { label: "Min", value: `${fmt(view.series.T2M_MIN[i])} °C` },
            ]} />
          <DailyChart title="Root-zone soil wetness" subtitle="0 = dry, 1 = saturated" dates={view.dates}
            color="var(--viz-soil)" line={view.series.GWETROOT} yDomain={[0, 1]}
            refs={[
              { y: chartCrop.rootDry, label: "drought stress" },
              ...(chartCrop.rootWet !== null ? [{ y: chartCrop.rootWet, label: "waterlogging" }] : []),
            ]}
            tooltip={(i) => [
              { label: "Root zone", value: fmt(view.series.GWETROOT[i], 2) },
              { label: "Topsoil", value: fmt(view.series.GWETTOP[i], 2) },
            ]} />
          <p className="source-line">
            Thresholds on the charts are for {chartCrop.name.toLowerCase()}. Source: NASA POWER daily point API
            (community AG), on a grid about 50 km wide. <button type="button" className="edit-button" onClick={downloadCsv}>Download CSV</button>
          </p>
        </section>
      </div>

      <p className="decision-note">
        <strong>Rules of thumb, not a prescription.</strong> The crop check looks back at past weather. It cannot see
        soil tests, pests or prices. Confirm planting decisions with a local agricultural officer.
      </p>
    </div>
  );
}
