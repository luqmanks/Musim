import type { ClimateSummary, PriorityKey, RotationScore, ScenarioKey } from "../../lib/field-shift";
import { cropLabel } from "../../lib/field-shift";
import { PRIORITIES, SCENARIOS, type ResultTab } from "./config";
import { Icon } from "./SharedUi";
import type { FieldLocation } from "../../lib/field-shift";

type ResultsStepProps = {
  location: FieldLocation | null;
  climate: ClimateSummary | null;
  loading: boolean;
  resultTab: ResultTab;
  scenario: ScenarioKey;
  results: RotationScore[];
  onEdit: () => void;
  onTabChange: (tab: ResultTab) => void;
  onScenarioChange: (scenario: ScenarioKey) => void;
};

export function ResultsStep({
  location,
  climate,
  loading,
  resultTab,
  scenario,
  results,
  onEdit,
  onTabChange,
  onScenarioChange,
}: ResultsStepProps) {
  return (
    <div className="results-content">
      <div className="result-header">
        <div>
          <span className="location-kicker"><Icon name="pin" /> {location?.name}{location?.areaHectares ? ` · ${location.areaHectares} ha` : ""}</span>
          <h1 id="panel-title">Your field brief</h1>
          <p>Conditions, evidence and rotation trade-offs in one view.</p>
        </div>
        <button className="edit-button" type="button" onClick={onEdit}>Edit my answers</button>
      </div>
      <div className="result-tabs" role="tablist" aria-label="Result views">
        <button role="tab" aria-selected={resultTab === "conditions"} onClick={() => onTabChange("conditions")}>Conditions</button>
        <button role="tab" aria-selected={resultTab === "rotations"} onClick={() => onTabChange("rotations")}>Rotations</button>
      </div>

      {loading && (
        <div className="loading-state" role="status">
          <span className="loading-orbit" /><h2>Reading the field from space</h2><p>Building a five-year climate profile from NASA POWER…</p>
        </div>
      )}

      {!loading && climate && resultTab === "conditions" && (
        <div className="conditions-view">
          {climate.isFallback && <div className="data-warning"><strong>Demonstration climate shown</strong><span>The live NASA request was unavailable. Scores are clearly marked as lower confidence.</span></div>}
          <div className="conditions-summary">
            <div className="metric-row">
              <div><span>Typical rainfall</span><strong>{Math.round(climate.annualRainMm).toLocaleString()} <small>mm/yr</small></strong></div>
              <div><span>Average temperature</span><strong>{climate.meanTempC.toFixed(1)} <small>°C</small></strong></div>
              <div><span>Wettest month</span><strong>{climate.wettestMonth}</strong></div>
              <div><span>Drier months</span><strong>{climate.dryMonths}</strong></div>
            </div>
            <div className="insight-callout"><span aria-hidden="true">↳</span><p><strong>{climate.wettestMonth} carries the strongest heavy-rain pressure.</strong> Avoid leaving the field bare when erosion exposure is highest.</p></div>
            <div className="provenance-card">
              <div><span>Source</span><strong>{climate.source}</strong></div><div><span>Period</span><strong>{climate.period}</strong></div><div><span>Spatial context</span><strong>{climate.resolution}</strong></div>
              <a href={climate.sourceUrl} target="_blank" rel="noreferrer">Open NASA source</a>
            </div>
            <button className="primary-button" type="button" onClick={() => onTabChange("rotations")}>See rotation options</button>
          </div>
          <ClimateTimeline climate={climate} />
        </div>
      )}

      {!loading && climate && resultTab === "rotations" && (
        <div className="rotations-view">
          <div className="scenario-control">
            <div><strong>Stress-test the plan</strong><span>{SCENARIOS.find((item) => item.key === scenario)?.note}</span></div>
            <div>{SCENARIOS.map((item) => <button key={item.key} type="button" aria-pressed={scenario === item.key} onClick={() => onScenarioChange(item.key)}>{item.label}</button>)}</div>
          </div>
          <div className="rotation-cards">{results.map((result) => <RotationCard key={result.id} result={result} featured={result.id === "conservative"} />)}</div>
          <p className="decision-note">These comparisons support a conversation. Confirm crop timing, drainage, seed access and prices with a local agricultural officer before changing your rotation.</p>
        </div>
      )}
    </div>
  );
}

function ClimateTimeline({ climate }: { climate: ClimateSummary }) {
  const maxRain = Math.max(...climate.monthly.map((month) => month.rainMm), 1);

  return (
    <div className="timeline-card">
      <div className="section-heading compact">
        <div><h3>Season rhythm</h3><p>Typical monthly rainfall and heat across {climate.period}.</p></div>
        <span className="source-chip">NASA POWER</span>
      </div>
      <div className="climate-timeline" role="img" aria-label="Monthly rainfall and temperature timeline">
        {climate.monthly.map((month) => (
          <div className="month-column" key={month.month}>
            <div className="temperature-mark" style={{ bottom: `${Math.max(14, (month.maxTempC - 28) * 8)}%` }} title={`${month.maxTempC.toFixed(1)} °C maximum`} />
            <div className="rain-bar" style={{ height: `${Math.max(6, (month.rainMm / maxRain) * 82)}%` }} title={`${Math.round(month.rainMm)} mm rain`} />
            <span>{month.label}</span>
          </div>
        ))}
      </div>
      <div className="timeline-legend"><span><i className="legend-rain" /> rainfall</span><span><i className="legend-heat" /> maximum temperature</span></div>
    </div>
  );
}

function RotationCard({ result, featured }: { result: RotationScore; featured?: boolean }) {
  const keyScores: PriorityKey[] = ["water", "soil", "income", "erosion"];

  return (
    <article className={`rotation-card ${featured ? "featured" : ""}`}>
      <header><div><span>{result.label}</span><h3>{result.descriptor}</h3></div><div className="overall-score"><strong>{result.total}</strong><small>/100</small></div></header>
      <div className="crop-sequence">
        {result.crops.map((crop, index) => <div key={`${crop}-${index}`}><span>{index + 1}</span><strong>{cropLabel(crop)}</strong>{index < result.crops.length - 1 && <i aria-hidden="true" />}</div>)}
      </div>
      <div className="score-grid">
        {keyScores.map((key) => <div key={key}><span>{PRIORITIES.find((item) => item.key === key)?.label}</span><strong>{result.scores[key]}</strong><div><i style={{ width: `${result.scores[key]}%` }} /></div></div>)}
      </div>
      <details className="evidence-details" open={featured}>
        <summary>Why this score</summary><ul>{result.why.map((reason) => <li key={reason}>{reason}</li>)}</ul>
        <h4>NASA evidence</h4><ul>{result.evidence.map((item) => <li key={item}>{item}</li>)}</ul>
        <h4>Check locally</h4><ul>{result.risks.map((risk) => <li key={risk}>{risk}</li>)}</ul>
      </details>
      <footer><span className={`confidence ${result.confidence.toLowerCase()}`}>{result.confidence} confidence</span><span>{result.gaps.length} information gap{result.gaps.length === 1 ? "" : "s"}</span></footer>
    </article>
  );
}
