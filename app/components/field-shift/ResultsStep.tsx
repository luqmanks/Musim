import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CornerDownRight } from "lucide-react";
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
          <h1 id="panel-title">Your field plan</h1>
          <span className="location-kicker"><Icon name="pin" /> {location?.name}{location?.areaHectares ? ` · ${location.areaHectares.toLocaleString()} ha` : ""}</span>
          <p>See what the climate means for this field, then compare practical rotation options.</p>
        </div>
        <Button variant="ghost" type="button" onClick={onEdit}>Edit answers</Button>
      </div>
      <Tabs value={resultTab} onValueChange={(value) => onTabChange(value as ResultTab)} className="results-tabs-shell">
        <TabsList className="result-tabs" aria-label="Result views">
          <TabsTrigger value="conditions">Field conditions</TabsTrigger>
          <TabsTrigger value="rotations">Rotation options</TabsTrigger>
        </TabsList>

        {loading && (
          <div className="loading-state" role="status">
            <span className="loading-orbit" /><h2>Reading the field from space</h2><p>Building a five-year climate profile from NASA POWER…</p>
          </div>
        )}

        {!loading && climate && (
        <TabsContent value="conditions" className="conditions-view">
          {climate.isFallback && <div className="data-warning"><strong>Demonstration climate shown</strong><span>The live NASA request was unavailable. Scores are clearly marked as lower confidence.</span></div>}
          <div className="conditions-summary">
            <div className="metric-row">
              <div><span>Typical rainfall</span><strong>{Math.round(climate.annualRainMm).toLocaleString()} <small>mm/yr</small></strong></div>
              <div><span>Average temperature</span><strong>{climate.meanTempC.toFixed(1)} <small>°C</small></strong></div>
              <div><span>Wettest month</span><strong>{climate.wettestMonth}</strong></div>
              <div><span>Drier months</span><strong>{climate.dryMonths}</strong></div>
            </div>
            <Card className="insight-callout"><CornerDownRight className="icon" aria-hidden="true" /><p><strong>What this means: {climate.wettestMonth} has the strongest heavy-rain pressure.</strong> Keep living cover on the soil where possible and confirm drainage in the field.</p></Card>
            <Card className="provenance-card">
              <div><span>Source</span><strong>{climate.source}</strong></div><div><span>Period</span><strong>{climate.period}</strong></div><div><span>Spatial context</span><strong>{climate.resolution}</strong></div>
              <a href={climate.sourceUrl} target="_blank" rel="noreferrer">Open NASA source</a>
            </Card>
            <Button className="step-primary" size="lg" type="button" onClick={() => onTabChange("rotations")}>See rotation options</Button>
          </div>
          <ClimateTimeline climate={climate} />
        </TabsContent>
        )}

        {!loading && climate && (
        <TabsContent value="rotations" className="rotations-view">
          <div className="scenario-control">
            <div><strong>Stress-test the plan</strong><span>{SCENARIOS.find((item) => item.key === scenario)?.note}</span></div>
            <div>{SCENARIOS.map((item) => <Button key={item.key} variant="ghost" size="sm" type="button" aria-pressed={scenario === item.key} onClick={() => onScenarioChange(item.key)}>{item.label}</Button>)}</div>
          </div>
          <div className="rotation-cards">{results.map((result) => <RotationCard key={result.id} result={result} featured={result.id === "conservative"} />)}</div>
          <p className="decision-note"><strong>Use this as a conversation guide.</strong> Confirm crop timing, drainage, seed access and prices with a local agricultural officer before changing your rotation.</p>
        </TabsContent>
        )}
      </Tabs>
    </div>
  );
}

function ClimateTimeline({ climate }: { climate: ClimateSummary }) {
  const maxRain = Math.max(...climate.monthly.map((month) => month.rainMm), 1);

  return (
    <Card className="timeline-card">
      <div className="section-heading compact">
        <div><h3>Season rhythm</h3><p>Typical monthly rainfall and heat across {climate.period}.</p></div>
        <Badge variant="secondary" className="source-chip">NASA POWER</Badge>
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
    </Card>
  );
}

function RotationCard({ result, featured }: { result: RotationScore; featured?: boolean }) {
  const keyScores: PriorityKey[] = ["water", "soil", "income", "erosion"];

  return (
    <Card className={`rotation-card ${featured ? "featured" : ""}`} aria-labelledby={`rotation-${result.id}-title`}>
      <CardHeader>
        <div><Badge variant={featured ? "default" : "secondary"} className="rotation-label">{result.label}</Badge><h3 id={`rotation-${result.id}-title`}>{result.descriptor}</h3></div>
        <div className="overall-score"><span>Fit score</span><div><strong>{result.total}</strong><small>/100</small></div></div>
      </CardHeader>
      <CardContent className="rotation-card-content">
        <div className="crop-sequence">
          {result.crops.map((crop, index) => <div key={`${crop}-${index}`}><span>{index + 1}</span><strong>{cropLabel(crop)}</strong>{index < result.crops.length - 1 && <i aria-hidden="true" />}</div>)}
        </div>
        <div className="score-grid">
          {keyScores.map((key) => <div key={key}><span>{PRIORITIES.find((item) => item.key === key)?.label}</span><strong>{result.scores[key]}</strong><div role="meter" aria-label={`${PRIORITIES.find((item) => item.key === key)?.label} score`} aria-valuemin={0} aria-valuemax={100} aria-valuenow={result.scores[key]}><i style={{ width: `${result.scores[key]}%` }} /></div></div>)}
        </div>
      </CardContent>
      <details className="evidence-details" open={featured}>
        <summary><span>Evidence and local checks</span><small>{result.evidence.length + result.risks.length} items</small></summary>
        <div className="evidence-body">
          <h4>Why it fits</h4><ul>{result.why.map((reason) => <li key={reason}>{reason}</li>)}</ul>
          <h4>NASA evidence</h4><ul>{result.evidence.map((item) => <li key={item}>{item}</li>)}</ul>
          <h4>Check locally</h4><ul>{result.risks.map((risk) => <li key={risk}>{risk}</li>)}</ul>
        </div>
      </details>
      <CardFooter><Badge variant="secondary" className={`confidence ${result.confidence.toLowerCase()}`}>{result.confidence} confidence</Badge><span className="gap-count">{result.gaps.length} information gap{result.gaps.length === 1 ? "" : "s"}</span></CardFooter>
    </Card>
  );
}
