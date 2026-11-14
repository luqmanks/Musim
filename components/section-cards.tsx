import type { FieldLocation, RotationScore } from "@/app/lib/field-shift"

export function SectionCards({ location, results }: { location: FieldLocation | null; results: RotationScore[] }) {
  const baseline = results.find((result) => result.id === "current")
  const best = results.reduce<RotationScore | undefined>((top, item) => !top || item.total > top.total ? item : top, undefined)
  return <dl className="rotation-overview">
    <div><dt>Field</dt><dd>{location?.name ?? "Selected field"}</dd><p>{location?.areaHectares ? `${location.areaHectares.toLocaleString()} ha mapped` : "Point-based estimate"}</p></div>
    <div><dt>Current rotation</dt><dd>{baseline ? `${baseline.total}/100` : "—"}</dd><p>Fit with your priorities</p></div>
    <div><dt>Highest scoring option</dt><dd>{best?.label ?? "No comparison yet"}</dd><p>{best ? `${best.total}/100 fit · ${best.confidence.toLowerCase()} confidence` : "Load climate data to compare"}</p></div>
  </dl>
}
