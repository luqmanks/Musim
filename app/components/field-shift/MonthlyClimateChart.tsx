"use client";

import { Bar, CartesianGrid, ComposedChart, Line, XAxis, YAxis } from "recharts";
import { ChartContainer, ChartLegend, ChartLegendContent, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import type { ClimateSummary } from "../../lib/field-shift";

export function MonthlyClimateChart({ climate }: { climate: ClimateSummary }) {
  return (
    <div className="min-w-0">
    <div className="mb-2 flex justify-between gap-4 text-xs text-muted-foreground">
      <span>Rainfall (mm)</span>
      <span className="text-right">Temperature (°C)</span>
    </div>
    <ChartContainer className="h-80 w-full aspect-auto" aria-label="Monthly rainfall and maximum temperature"
      config={{
        rainMm: { label: "Rainfall (mm)", color: "var(--chart-2)" },
        maxTempC: { label: "Maximum temperature (°C)", color: "var(--chart-5)" },
      }}>
      <ComposedChart accessibilityLayer data={climate.monthly} margin={{ top: 20, left: 0, right: 0, bottom: 0 }}>
        <CartesianGrid vertical={false} />
        <XAxis dataKey="label" tickLine={false} axisLine={false} tickMargin={10} minTickGap={16} />
        <YAxis yAxisId="rain" domain={[0, "auto"]} tickLine={false} axisLine={false} width={48} tickFormatter={(value) => `${value}`} />
        <YAxis yAxisId="temperature" orientation="right" tickLine={false} axisLine={false} width={42} />
        <ChartTooltip content={<ChartTooltipContent formatter={(value, name) => (
          <div className="flex w-full justify-between gap-4">
            <span className="text-muted-foreground">{name === "rainMm" ? "Rainfall" : "Maximum temperature"}</span>
            <span className="font-medium tabular-nums">{Number(value).toFixed(name === "rainMm" ? 0 : 1)} {name === "rainMm" ? "mm" : "°C"}</span>
          </div>
        )} />} />
        <ChartLegend content={<ChartLegendContent />} />
        <Bar yAxisId="rain" dataKey="rainMm" fill="var(--color-rainMm)" radius={[4, 4, 0, 0]} maxBarSize={40} isAnimationActive={false} />
        <Line yAxisId="temperature" dataKey="maxTempC" type="linear" stroke="var(--color-maxTempC)" strokeWidth={2} dot={{ r: 3 }} isAnimationActive={false} />
      </ComposedChart>
    </ChartContainer>
    </div>
  );
}
