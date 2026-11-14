import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CornerDownRight } from "lucide-react";
import type { ClimateSummary, FarmProfile, PriorityKey, RotationScore, ScenarioKey } from "../../lib/field-shift";
import { climateInsight, cropLabel, scenarioNote } from "../../lib/field-shift";
import type { FieldLocation } from "../../lib/field-shift";
import { CropCheckTab } from "./CropCheckTab";
import { PRIORITIES, SCENARIOS, type ResultTab } from "./config";
import { Icon } from "./SharedUi";

type ResultsStepProps = {
  location: FieldLocation | null;
  climate: ClimateSummary | null;
  loading: boolean;
  error: string;
  onRetry: () => void;
  resultTab: ResultTab;
  scenario: ScenarioKey;
  results: RotationScore[];
  profile: FarmProfile;
  onEdit: () => void;
  onTabChange: (tab: ResultTab) => void;
  onScenarioChange: (scenario: ScenarioKey) => void;
};

export function ResultsStep({
  location,
  climate,
  loading,
  error,
  onRetry,
  resultTab,
  scenario,
  results,
  profile,
  onEdit,
  onTabChange,
  onScenarioChange,
}: ResultsStepProps) {
  const insight = climate ? climateInsight(climate) : null;

  return (
    <div className="results-content">
      <div className="result-header">
        <div>
          <h1 id="panel-title">Your field plan</h1>
          <span className="location-kicker"><Icon name="pin" /> {location?.name}{location?.areaHectares ? ` · ${location.areaHectares.toLocaleString()} ha` : ""}</span>
          <p>See what the climate means for this field, compare rotation options, and check which crops suit it right now.</p>
        </div>
        <Button variant="ghost" type="button" onClick={onEdit}>Edit answers</Button>
      </div>

      <Tabs value={resultTab} onValueChange={(value) => onTabChange(value as ResultTab)} className="results-tabs-shell">
        <TabsList className="result-tabs" aria-label="Result views">
          <TabsTrigger value="conditions">Field conditions</TabsTrigger>
          <TabsTrigger value="rotations">Rotation options</TabsTrigger>
          <TabsTrigger value="crops">Crop check</TabsTrigger>
        </TabsList>

        {loading && resultTab !== "crops" && (
          <div className="loading-state" role="status">
            <span className="loading-orbit" /><h2>Reading the field from space</h2><p>Building a five-year climate profile from NASA POWER…</p>
          </div>
        )}

        {!loading && error && resultTab !== "crops" && (
          <div className="data-warning" role="alert">
            <strong>NASA POWER data could not be loaded</strong>
            <span>{error} Nothing is shown in its place, because results need real data.</span>
            <Button variant="outline" type="button" onClick={onRetry}>Try again</Button>
          </div>
        )}

        {!loading && climate && (
          <TabsContent value="conditions" className="conditions-view">
            <div className="conditions-summary">
              <div className="metric-row">
                <div><span>Typical rainfall</span><strong>{Math.round(climate.annualRainMm).toLocaleString()} <small>mm/yr</small></strong></div>
                <div><span>Average temperature</span><strong>{climate.meanTempC.toFixed(1)} <small>°C</small></strong></div>
                <div><span>Wettest month</span><strong>{climate.wettestMonth}</strong></div>
                <div title="Months where rain (mm) is below twice the mean temperature (°C)"><span>Dry months (Gaussen)</span><strong>{climate.dryMonths}</strong></div>
              </div>
              <Card className="insight-callout"><CornerDownRight className="icon" aria-hidden="true" /><p><strong>What this means: {insight?.headline}</strong> {insight?.detail}</p></Card>
              <Card className="provenance-card">
                <div><span>Source</span><strong>{climate.source}</strong></div><div><span>Period</span><strong>{climate.period}</strong></div><div><span>Spatial context</span><strong>{climate.resolution}</strong></div>
                <a href={climate.sourceUrl} target="_blank" rel="noreferrer">Open NASA source</a>
              </Card>
              <Button className="step-primary" size="lg" type="button" onClick={() => onTabChange("rotations")}>See rotation options</Button>
            </div>
            <ClimateTimeline climate={climate} />
          </TabsContent>
        )}

        {location && (
          <TabsContent value="crops">
            <CropCheckTab location={location} profile={profile} />
          </TabsContent>
        )}

        {!loading && climate && (
          <TabsContent value="rotations" className="rotations-view">
            <div className="scenario-control">
              <div><strong>Stress-test the plan</strong><span>{scenarioNote(climate, scenario)}</span></div>
              <div>{SCENARIOS.map((item) => <Button key={item.key} variant="ghost" size="sm" type="button" aria-pressed={scenario === item.key} onClick={() => onScenarioChange(item.key)}>{item.label}</Button>)}</div>
            </div>
            <div className="rotation-cards">{results.map((result, index) => <RotationCard key={result.id} result={result} featured={index === 1} />)}</div>
            <p className="decision-note"><strong>Use this as a conversation guide.</strong> Confirm crop timing, drainage, seed access and prices with a local agricultural officer before changing your rotation.</p>
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}

function ClimateTimeline({ climate }: { climate: ClimateSummary }) {
  const maxRain = Math.max(...climate.monthly.map((month) => month.rainMm), 1);
  const temperatures = climate.monthly.map((month) => month.maxTempC);
  const minTemperature = Math.min(...temperatures);
  const temperatureSpan = Math.max(...temperatures) - minTemperature;
  const markAt = (temperature: number) => (temperatureSpan > 0 ? 14 + ((temperature - minTemperature) / temperatureSpan) * 72 : 50);

  return (
    <Card className="timeline-card">
      <div className="section-heading compact">
        <div><h3>Season rhythm</h3><p>Typical monthly rainfall and heat across {climate.period}.</p></div>
        <Badge variant="secondary" className="source-chip">NASA POWER</Badge>
      </div>
      <div className="climate-timeline" role="img" aria-label="Monthly rainfall and temperature timeline">
        {climate.monthly.map((month) => (
          <div className="month-column" key={month.month}>
            <div className="temperature-mark" style={{ bottom: `${markAt(month.maxTempC)}%` }} title={`${month.maxTempC.toFixed(1)} °C maximum`} />
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
          {result.crops.map((crop, index) => <div key={`${crop}-${index}`}><span>{index + 1}</span><strong>{cropLabel(crop)}</strong><small>{result.seasons[index].window} · {Math.round(result.seasons[index].rainMm)} mm</small>{index < result.crops.length - 1 && <i aria-hidden="true" />}</div>)}
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
