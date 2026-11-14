import type { ClimateSummary, FarmProfile, FieldLocation, PriorityKey, RotationScore, ScenarioKey } from "../../lib/field-shift";
import { cropLabel, scenarioNote } from "../../lib/field-shift";
import { PRIORITIES, SCENARIOS } from "./config";

export type FieldPlanReportProps = {
  location: FieldLocation | null;
  climate: ClimateSummary | null;
  results: RotationScore[];
  profile: FarmProfile;
  priorities: Record<PriorityKey, number>;
  scenario: ScenarioKey;
};

const answers: Record<string, string> = {
  unknown: "Not known — confirm locally", "clay-poor": "Clay, slow drainage",
  loam: "Loam, moderate drainage", sandy: "Sandy, fast drainage", peat: "Peat or organic soil",
  reliable: "Reliable irrigation", seasonal: "Seasonal water availability", limited: "Limited",
  standard: "Standard paddy equipment", flexible: "Equipment for several crops", manual: "Mostly manual",
  local: "Local buyers available", contract: "Contract buyer",
};

export function FieldPlanReport({ location, climate, results, profile, priorities, scenario }: FieldPlanReportProps) {
  const best = results.reduce<RotationScore | undefined>((top, item) => !top || item.total > top.total ? item : top, undefined);
  const baseline = results.find((item) => item.id === "current");
  return <article className="field-plan-report">
    <section className="report-overview">
      <h2>{location?.name ?? "Your field"}</h2>
      <p>Musim · Crop rotation plan</p>
      <dl className="report-facts">
        <div><dt>Field centre</dt><dd>{location ? `${location.lat.toFixed(4)}, ${location.lng.toFixed(4)}` : "Not selected"}</dd></div>
        <div><dt>Field area</dt><dd>{location?.areaHectares ? `${location.areaHectares.toLocaleString()} ha (estimated)` : "Point estimate; area not mapped"}</dd></div>
        <div><dt>Scenario</dt><dd>{SCENARIOS.find((item) => item.key === scenario)?.label}</dd></div>
      </dl>
      {climate && <p>{scenarioNote(climate, scenario)}</p>}
      <h3>Comparison at a glance</h3>
      {best && <p><strong>{best.label}</strong> has the highest fit score in this comparison: <strong>{best.total}/100</strong>. Review its seasonal plan and local checks before deciding.</p>}
      <div className="report-table-wrap"><table><thead><tr><th>Option</th><th>Crop sequence</th><th>Fit /100</th></tr></thead><tbody>
        {results.map((result) => <tr key={result.id}><th scope="row">{result.label}</th><td>{result.crops.map(cropLabel).join(" → ")}</td><td>{result.total}</td></tr>)}
      </tbody></table></div>
      <p className="share-note">Fit scores compare options against your priorities. They are not yield, profit or success forecasts. A higher score is a better match within this model.</p>
      <h3>Your farm details</h3>
      <dl className="report-facts">{([
        ["Current rotation", profile.rotation.map(cropLabel).join(" → ")],
        ["Soil", answers[profile.soil] ?? profile.soil], ["Water", answers[profile.water] ?? profile.water],
        ["Equipment", answers[profile.equipment] ?? profile.equipment], ["Buyers", answers[profile.market] ?? profile.market],
      ]).map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}</dl>
      <h3>Your priorities</h3>
      <p>Higher weights give a priority more influence on the overall fit score.</p>
      <ul>{PRIORITIES.map((item) => <li key={item.key}>{item.label}: <strong>{priorities[item.key]}</strong></li>)}</ul>
    </section>

    {results.map((result) => <section className="report-rotation" key={result.id}>
      <h2>{result.label}</h2><p>{result.descriptor}</p>
      <p><strong>{result.total}/100 fit · {result.confidence} confidence</strong></p>
      {baseline && result.id !== "current" && <p>{result.total - baseline.total > 0 ? "+" : ""}{result.total - baseline.total} points compared with your current rotation. {result.changes} season{result.changes === 1 ? "" : "s"} changed.</p>}
      <h3>Season-by-season plan</h3>
      <ol className="report-seasons">{result.seasons.map((season, index) => <li key={index}>
        <strong>Season {index + 1}: {cropLabel(season.crop)}</strong><span>{season.window}</span>
        <p>{Math.round(season.rainMm)} mm rain · {season.tempC.toFixed(1)} °C average temperature</p>
        <p>Estimated crop water need: {Math.round(season.needMm)} mm. Rainfall shortfall: {Math.round(season.deficitMm)} mm.</p>
      </li>)}</ol>
      <p className="share-note">Season windows are modelled four-month periods. A rainfall shortfall compares crop water need with rain; it is not an irrigation prescription. Check planting dates and usable water locally.</p>
      <h3>How this option scores</h3>
      <dl className="report-facts">{PRIORITIES.map((item) => <div key={item.key}><dt>{item.label}</dt><dd>{result.scores[item.key]}/100</dd></div>)}</dl>
      <h3>Why it fits</h3><ul>{result.why.map((item) => <li key={item}>{item}</li>)}</ul>
      <h3>Climate evidence</h3><ul>{result.evidence.map((item) => <li key={item}>{item}</li>)}</ul>
      <h3>Check before planting</h3><ul>{result.risks.map((item) => <li key={item}>{item}</li>)}</ul>
      {result.gaps.length > 0 && <><h3>Information still needed</h3><ul>{result.gaps.map((item) => <li key={item}>{item}</li>)}</ul></>}
      <p><strong>Confidence:</strong> {result.confidenceReason}</p>
    </section>)}

    {climate && <section className="report-climate">
      <h2>Climate and data sources</h2>
      <p>Historical averages for {climate.period}. These values describe typical conditions, not a forecast. Rotation details above use the selected scenario.</p>
      <dl className="report-facts">
        <div><dt>Annual rain</dt><dd>{Math.round(climate.annualRainMm).toLocaleString()} mm</dd></div>
        <div><dt>Mean temperature</dt><dd>{climate.meanTempC.toFixed(1)} °C</dd></div>
        <div><dt>Wettest month</dt><dd>{climate.wettestMonth}</dd></div>
        <div><dt>Data coverage</dt><dd>{Math.round(climate.coverage * 100)}%</dd></div>
      </dl>
      <div className="report-table-wrap"><table><thead><tr><th>Month</th><th>Rain (mm)</th><th>Mean (°C)</th><th>Max (°C)</th></tr></thead><tbody>
        {climate.monthly.map((month) => <tr key={month.month}><th scope="row">{month.label}</th><td>{Math.round(month.rainMm)}</td><td>{month.tempC.toFixed(1)}</td><td>{month.maxTempC.toFixed(1)}</td></tr>)}
      </tbody></table></div>
      <p><strong>Source:</strong> {climate.source}<br /><strong>Spatial context:</strong> {climate.resolution}<br /><strong>Retrieved:</strong> {climate.retrievedAt}</p>
      <p className="report-source-url">{climate.sourceUrl}</p>
      <p>NASA data provide regional context, not a direct measurement of this field. Use field observations, soil tests and local advice to check drainage, pests, water availability and market access.</p>
      <h3>Notes for your farm adviser</h3><div className="report-notes" aria-label="Space for handwritten notes" />
    </section>}
  </article>;
}
