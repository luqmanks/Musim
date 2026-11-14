"use client";

import { Area, Bar, CartesianGrid, ComposedChart, Line, ReferenceLine, XAxis, YAxis } from "recharts";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";

type Series = (number | null)[];
export type DailyChartProps = {
  title: string;
  subtitle?: string;
  dates: string[];
  color: string;
  bars?: Series;
  line?: Series;
  band?: { lo: Series; hi: Series };
  refs?: { y: number; label: string }[];
  yDomain?: [number, number];
  tooltip: (i: number) => { label: string; value: string }[];
};

const shortDate = (iso: string) => new Date(`${iso}T00:00:00Z`).toLocaleDateString(undefined, {
  day: "numeric", month: "short", timeZone: "UTC",
});

export default function DailyChart(p: DailyChartProps) {
  const data = p.dates.map((date, index) => ({
    date, index,
    value: p.bars?.[index] ?? p.line?.[index] ?? null,
    range: p.band?.lo[index] != null && p.band.hi[index] != null
      ? [p.band.lo[index], p.band.hi[index]] : null,
  }));
  const hasData = data.some((item) => item.value !== null || item.range !== null);

  return (
    <figure className="fs-chart">
      <figcaption><strong>{p.title}</strong>{p.subtitle && <span>{p.subtitle}</span>}</figcaption>
      {!hasData ? <p className="fs-chart-empty">No data for this period.</p> : (
        <ChartContainer className="h-64 w-full aspect-auto" aria-label={`${p.title} chart`}
          config={{ value: { label: p.title, color: p.color }, range: { label: "Daily minimum–maximum", color: p.color } }}>
          <ComposedChart accessibilityLayer data={data} margin={{ top: 24, right: 16, bottom: 8, left: 0 }}>
            <CartesianGrid vertical={false} />
            <XAxis dataKey="date" tickFormatter={shortDate} tickLine={false} axisLine={false} minTickGap={48} tickMargin={10} />
            <YAxis domain={p.yDomain ?? (p.bars ? [0, "auto"] : ["auto", "auto"])} tickLine={false} axisLine={false} width={42} />
            <ChartTooltip content={({ active, payload }) => {
              const index = payload?.[0]?.payload?.index;
              if (!active || typeof index !== "number") return null;
              return <ChartTooltipContent active label={shortDate(p.dates[index])}
                payload={p.tooltip(index).map((row) => ({ name: row.label, value: row.value, color: p.color, graphicalItemId: row.label }))} />;
            }} />
            {p.band && <Area dataKey="range" type="linear" stroke="none" fill="var(--color-range)" fillOpacity={0.16} connectNulls={false} isAnimationActive={false} />}
            {p.bars && <Bar dataKey="value" fill="var(--color-value)" radius={[3, 3, 0, 0]} maxBarSize={16} isAnimationActive={false} />}
            {p.line && <Line dataKey="value" type="linear" stroke="var(--color-value)" strokeWidth={2} dot={false} connectNulls={false} isAnimationActive={false} />}
            {p.refs?.map((ref) => <ReferenceLine key={ref.label} y={ref.y} ifOverflow="extendDomain"
              stroke="var(--chart-3)" strokeDasharray="4 4"
              label={{ value: ref.label, position: "insideTopRight", fill: "var(--muted-foreground)", fontSize: 11 }} />)}
          </ComposedChart>
        </ChartContainer>
      )}
    </figure>
  );
}
