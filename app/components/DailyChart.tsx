"use client";

import { useEffect, useRef, useState } from "react";

type Series = (number | null)[];

export type DailyChartProps = {
  title: string;
  subtitle?: string;
  dates: string[];
  color: string; // CSS colour, e.g. "var(--viz-rain)"
  bars?: Series;
  line?: Series;
  band?: { lo: Series; hi: Series };
  refs?: { y: number; label: string }[];
  yDomain?: [number, number];
  tooltip: (i: number) => { label: string; value: string }[];
};

const H = 132;
const PAD = { l: 34, r: 8, t: 8, b: 20 };

const short = (iso: string) =>
  new Date(iso + "T00:00:00Z").toLocaleDateString(undefined, { day: "numeric", month: "short", timeZone: "UTC" });

function niceTicks(min: number, max: number, count = 3) {
  const span = max - min || 1;
  const raw = span / count;
  const mag = 10 ** Math.floor(Math.log10(raw));
  const step = [1, 2, 2.5, 5, 10].map((m) => m * mag).find((s) => s >= raw) ?? raw;
  const out: number[] = [];
  for (let v = Math.ceil(min / step) * step; v <= max + 1e-9; v += step) out.push(+v.toFixed(6));
  return out;
}

/** Path for a nullable series; gaps break the line instead of being drawn as zero. */
function linePath(vals: Series, x: (i: number) => number, y: (v: number) => number) {
  let d = "";
  let pen = false;
  vals.forEach((v, i) => {
    if (v === null) { pen = false; return; }
    d += `${pen ? "L" : "M"}${x(i).toFixed(1)},${y(v).toFixed(1)}`;
    pen = true;
  });
  return d;
}

function bandPaths(lo: Series, hi: Series, x: (i: number) => number, y: (v: number) => number) {
  const paths: string[] = [];
  let run: number[] = [];
  const flush = () => {
    if (run.length) {
      const top = run.map((i) => `${x(i).toFixed(1)},${y(hi[i]!).toFixed(1)}`);
      const bot = [...run].reverse().map((i) => `${x(i).toFixed(1)},${y(lo[i]!).toFixed(1)}`);
      paths.push(`M${top.join("L")}L${bot.join("L")}Z`);
    }
    run = [];
  };
  lo.forEach((v, i) => (v !== null && hi[i] !== null ? run.push(i) : flush()));
  flush();
  return paths;
}

export default function DailyChart(p: DailyChartProps) {
  const wrap = useRef<HTMLDivElement>(null);
  const [w, setW] = useState(340);
  const [hover, setHover] = useState<number | null>(null);

  useEffect(() => {
    const el = wrap.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => setW(Math.max(200, Math.floor(e.contentRect.width))));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const n = p.dates.length;
  const all = [...(p.bars ?? []), ...(p.line ?? []), ...(p.band?.lo ?? []), ...(p.band?.hi ?? [])].filter(
    (v): v is number => v !== null,
  );
  const hasData = all.length > 0;
  let [y0, y1] = p.yDomain ?? [Math.min(...all), Math.max(...all)];
  if (!p.yDomain) {
    if (p.bars) y0 = 0;
    const padY = (y1 - y0) * 0.1 || 1;
    y0 = p.bars ? 0 : y0 - padY;
    y1 = y1 + padY;
  }
  const ticks = hasData ? niceTicks(y0, y1) : [];
  const iw = w - PAD.l - PAD.r;
  const ih = H - PAD.t - PAD.b;
  const step = iw / Math.max(1, n);
  const x = (i: number) => PAD.l + step * (i + 0.5);
  const y = (v: number) => PAD.t + ih - ((v - y0) / (y1 - y0 || 1)) * ih;
  const barW = Math.max(1, Math.min(10, step - 2)); // 2px surface gap between bars
  const xLabels = n ? [0, Math.floor((n - 1) / 2), n - 1] : [];

  function onMove(e: React.PointerEvent<SVGRectElement>) {
    const r = e.currentTarget.getBoundingClientRect();
    const i = Math.floor(((e.clientX - r.left) / r.width) * n);
    setHover(Math.min(n - 1, Math.max(0, i)));
  }

  const tip = hover !== null ? p.tooltip(hover) : null;
  const tipLeft = hover !== null ? Math.min(Math.max(x(hover) - 70, 0), w - 140) : 0;

  return (
    <figure className="fs-chart">
      <figcaption>
        <strong>{p.title}</strong>
        {p.subtitle && <span>{p.subtitle}</span>}
      </figcaption>
      <div ref={wrap} className="fs-chart-plot">
        {!hasData ? (
          <p className="fs-chart-empty">No data for this period.</p>
        ) : (
          <svg width={w} height={H} role="img" aria-label={`${p.title} chart`} className="fs-chart-svg">
            {ticks.map((t) => (
              <g key={t}>
                <line x1={PAD.l} x2={w - PAD.r} y1={y(t)} y2={y(t)} stroke="var(--viz-grid)" strokeWidth={1} />
                <text x={PAD.l - 6} y={y(t)} dy="0.32em" textAnchor="end" fontSize={10} fill="var(--viz-axis)">
                  {t}
                </text>
              </g>
            ))}
            {xLabels.map((i, k) => (
              <text key={i} x={x(i)} y={H - 4} fontSize={10} fill="var(--viz-axis)"
                textAnchor={k === 0 ? "start" : k === 2 ? "end" : "middle"}>
                {short(p.dates[i])}
              </text>
            ))}

            {p.band &&
              bandPaths(p.band.lo, p.band.hi, x, y).map((d, k) => (
                <path key={k} d={d} fill={p.color} fillOpacity={0.22} />
              ))}

            {p.bars?.map((v, i) =>
              v === null || v <= 0 ? null : (
                <rect key={i} x={x(i) - barW / 2} width={barW} y={y(v)} height={Math.max(1, y(0) - y(v))}
                  rx={Math.min(2, barW / 2)} fill={p.color} opacity={hover === null || hover === i ? 1 : 0.55} />
              ),
            )}

            {p.line && <path d={linePath(p.line, x, y)} fill="none" stroke={p.color} strokeWidth={2} strokeLinejoin="round" />}

            {p.refs?.map((r) =>
              r.y >= y0 && r.y <= y1 ? (
                <g key={r.label}>
                  <line x1={PAD.l} x2={w - PAD.r} y1={y(r.y)} y2={y(r.y)} stroke="var(--viz-ref)" strokeDasharray="4 3" strokeWidth={1} />
                  <text x={w - PAD.r} y={y(r.y) - 3} textAnchor="end" fontSize={10} fill="var(--viz-axis)">
                    {r.label}
                  </text>
                </g>
              ) : null,
            )}

            {hover !== null && (
              <>
                <line x1={x(hover)} x2={x(hover)} y1={PAD.t} y2={PAD.t + ih} stroke="var(--viz-axis)" strokeWidth={1} />
                {p.line?.[hover] != null && (
                  <circle cx={x(hover)} cy={y(p.line[hover]!)} r={4} fill={p.color} stroke="var(--white)" strokeWidth={2} />
                )}
              </>
            )}

            <rect x={PAD.l} y={0} width={iw} height={H} fill="transparent"
              onPointerMove={onMove} onPointerDown={onMove} onPointerLeave={() => setHover(null)} />
          </svg>
        )}
        {tip && hover !== null && (
          <div className="fs-chart-tip"
            style={{ left: tipLeft }}>
            <strong>{short(p.dates[hover])}</strong>
            {tip.map((r) => (
              <div key={r.label}>
                <span>{r.label}</span>
                <b>{r.value}</b>
              </div>
            ))}
          </div>
        )}
      </div>
    </figure>
  );
}
