import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { AppSidebar } from "@/components/app-sidebar";
import { SectionCards } from "@/components/section-cards";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import type {
  ClimateSummary,
  FarmProfile,
  PriorityKey,
  RotationScore,
  ScenarioKey,
} from "../../lib/field-shift";
import { climateInsight, cropLabel, scenarioNote } from "../../lib/field-shift";
import type { FieldLocation } from "../../lib/field-shift";
import { CropCheckTab } from "./CropCheckTab";
import { MonthlyClimateChart } from "./MonthlyClimateChart";
import { PRIORITIES, SCENARIOS, type ResultTab } from "./config";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, ChevronDown } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

type ResultsStepProps = {
  location: FieldLocation | null;
  climate: ClimateSummary | null;
  loading: boolean;
  error: string;
  resultTab: ResultTab;
  scenario: ScenarioKey;
  results: RotationScore[];
  profile: FarmProfile;
  onBack: () => void;
  onEdit: () => void;
  onShare: () => void;
  onTabChange: (tab: ResultTab) => void;
  onScenarioChange: (scenario: ScenarioKey) => void;
};

/** Words next to numbers so meaning never depends on color or a bar alone. */
function scoreLevel(score: number) {
  if (score >= 75) return "Strong";
  if (score >= 50) return "Moderate";
  return "Weak";
}

export function ResultsStep({
  location,
  climate,
  loading,
  error,
  resultTab,
  scenario,
  results,
  profile,
  onBack,
  onEdit,
  onShare,
  onTabChange,
  onScenarioChange,
}: ResultsStepProps) {
  const insight = climate ? climateInsight(climate) : null;
  const best =
    results.length > 0
      ? results.reduce((top, item) => (item.total > top.total ? item : top))
      : null;
  const needsClimate = resultTab !== "crops";
  const baseline = results.find((result) => result.id === "current");

  return (
    <SidebarProvider className="field-dashboard">
      <AppSidebar active={resultTab} fieldName={location?.name ?? "Selected field"} onNavigate={onTabChange} onEdit={onEdit} onShare={onShare} />
      <SidebarInset className="field-dashboard-inset">
        <div className="flex shrink-0 items-center gap-3 border-b px-4 py-3 lg:px-6">
          <SidebarTrigger />
          <Separator orientation="vertical" className="h-5" />
          <Button variant="ghost" size="sm" type="button" onClick={onBack}>
            <ArrowLeft aria-hidden="true" /> Back
          </Button>
          <h1 id="panel-title" className="text-base font-semibold">{resultTab === "rotations" ? "Rotation comparison" : resultTab === "conditions" ? "Field climate" : "Recent conditions"}</h1>
        </div>
        <Tabs value={resultTab} className="field-dashboard-body">
        <div className="plan-main" key={resultTab}>

        {/* One shared status area, so loading and error look the same on every climate tab */}
        {needsClimate && loading && <LoadingSkeleton />}

        {needsClimate && !loading && error && (
          <div className="data-warning" role="alert">
            <strong>We couldn’t load the climate profile</strong>
            <span>
              Open Recent conditions from the sidebar to see daily weather data.
            </span>
            <details className="mt-3">
              <summary>Technical details</summary>
              <p>{error}</p>
            </details>
          </div>
        )}

        {!loading && climate && (
          <TabsContent value="conditions" className="conditions-view">
            <div className="dashboard-section-header dashboard-wide"><div><h2>Seasonal climate</h2><p className="text-sm text-muted-foreground">Historical averages for {climate.period}. Use these to plan crop timing.</p></div></div>

            <ClimateTimeline climate={climate} />

            <div className="metric-row dashboard-metrics" aria-label="Climate summary">
              <div>
                <span>Typical rainfall</span>
                <strong>
                  {Math.round(climate.annualRainMm).toLocaleString()}{" "}
                  <small>mm/yr</small>
                </strong>
              </div>
              <div>
                <span>Average temperature</span>
                <strong>
                  {climate.meanTempC.toFixed(1)} <small>°C</small>
                </strong>
              </div>
              <div>
                <span>Wettest month</span>
                <strong>{climate.wettestMonth}</strong>
              </div>
              <div>
                <span>Dry months</span>
                <strong>{climate.dryMonths}</strong>
                {/* Visible on touch devices, unlike a title attribute */}
                <small className="block text-xs text-muted-foreground">
                  Rain (mm) below 2× mean temp (°C)
                </small>
              </div>
            </div>

            <div className="conditions-summary">
              <div className="field-insight">
                <h2>{insight?.headline}</h2>
                <p>{insight?.detail}</p>
              </div>
              <details className="climate-source">
                <summary>Data source and coverage</summary>
                <div className="provenance-card">
                  <div>
                    <span>Source</span>
                    <strong>{climate.source}</strong>
                  </div>
                  <div>
                    <span>Period</span>
                    <strong>{climate.period}</strong>
                  </div>
                  <div>
                    <span>Spatial context</span>
                    <strong>{climate.resolution}</strong>
                  </div>
                  <a href={climate.sourceUrl} target="_blank" rel="noreferrer">
                    Open NASA source
                    <span className="sr-only"> (opens in a new tab)</span>
                  </a>
                </div>
                <p>Historical averages, not a weather forecast.</p>
              </details>
            </div>


          </TabsContent>
        )}

        {location && (
          <TabsContent value="crops">
            <CropCheckTab location={location} profile={profile} />
          </TabsContent>
        )}

        {!loading && climate && (
          <TabsContent value="rotations" className="rotations-view">
            <div className="dashboard-section-header">
              <div>
                <h2>Compare crop rotations</h2>
                <p className="mt-1 text-sm text-muted-foreground">Your current rotation and alternatives, scored against your farm priorities.</p>
              </div>
            </div>
            <SectionCards location={location} results={results} />
            <details className="mb-5 rounded-xl border p-4">
              <summary className="cursor-pointer text-sm font-medium">Weather scenario: {SCENARIOS.find((item) => item.key === scenario)?.label}</summary>
            <div className="scenario-control mt-3">
              <div>
                <strong>Weather scenario</strong>
                <span aria-live="polite">
                  {scenarioNote(climate, scenario)}
                </span>
              </div>
              <div
                role="group"
                aria-label="Weather scenario"
                className="flex flex-wrap gap-1"
              >
                {SCENARIOS.map((item) => (
                  <Button
                    key={item.key}
                    variant={scenario === item.key ? "secondary" : "ghost"}
                    size="sm"
                    type="button"
                    aria-pressed={scenario === item.key}
                    onClick={() => onScenarioChange(item.key)}
                  >
                    {item.label}
                  </Button>
                ))}
              </div>
            </div>
            </details>

            <div className="rotation-cards">
              {results.map((result) => (
                <RotationCard
                  key={result.id}
                  result={result}
                  featured={best?.id === result.id}
                  baselineScore={baseline?.total}
                />
              ))}
            </div>

            <p className="rotation-score-note">
              Fit scores reflect your priorities, not predicted yield or profit.
              Before planting, confirm timing, drainage, seed availability and prices locally.
            </p>

          </TabsContent>
        )}
        </div>
        </Tabs>
      </SidebarInset>
    </SidebarProvider>
  );
}

function LoadingSkeleton() {
  return (
    <div className="loading-state" role="status" aria-busy="true">
      <h2>Loading climate data</h2>
      <p>
        Fetching five years of NASA POWER observations. This usually takes a few
        seconds.
      </p>
      <div className="mt-4 grid animate-pulse gap-3" aria-hidden="true">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="h-16 rounded-lg bg-muted" />
          ))}
        </div>
        <div className="h-40 rounded-lg bg-muted" />
      </div>
    </div>
  );
}

function ClimateTimeline({ climate }: { climate: ClimateSummary }) {
  return (
    <Card className="timeline-card">
      <div className="section-heading compact">
        <div>
          <h3>Rainfall and temperature</h3>
          <p>Monthly averages · {climate.period}</p>
        </div>
      </div>

      <MonthlyClimateChart climate={climate} />

      <details className="monthly-data">
      <summary><span>Monthly values</span><ChevronDown className="size-4" aria-hidden="true" /></summary>
      <Table className="tabular-nums" aria-label="Monthly rainfall and maximum temperature">
        <TableHeader>
          <TableRow>
            <TableHead scope="col">Month</TableHead>
            <TableHead scope="col" className="text-right">Rainfall (mm)</TableHead>
            <TableHead scope="col" className="text-right">Max temperature (°C)</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {climate.monthly.map((month) => (
            <TableRow key={month.month}>
              <TableHead scope="row">{month.label}</TableHead>
              <TableCell className="text-right">{Math.round(month.rainMm)}</TableCell>
              <TableCell className="text-right">{month.maxTempC.toFixed(1)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      </details>

    </Card>
  );
}

function RotationCard({
  result,
  featured,
  baselineScore,
}: {
  result: RotationScore;
  featured?: boolean;
  baselineScore?: number;
}) {
  const keyScores: PriorityKey[] = ["water", "soil", "income", "erosion", "nitrogen", "practicality"];
  const difference = baselineScore === undefined ? null : result.total - baselineScore;

  return (
    <Card
      className={`rotation-card ${featured ? "featured" : ""}`}
      aria-labelledby={`rotation-${result.id}-title`}
    >
      <CardHeader>
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <Badge
              variant={featured ? "default" : "secondary"}
              className="rotation-label"
            >
              {result.label}
            </Badge>
            {featured && <Badge variant="outline">Highest score</Badge>}
          </div>
          <h3 id={`rotation-${result.id}-title`}>{result.descriptor}</h3>
        </div>
        <div className="overall-score">
          <span>Fit score</span>
          <div>
            <strong>{result.total}</strong>
            <small>/100</small>
          </div>
          <small className="text-xs text-muted-foreground">
            {scoreLevel(result.total)}
          </small>
        </div>
      </CardHeader>

      <CardContent className="rotation-card-content">
        <div className="rotation-change-summary">
          <strong>{result.id === "current" ? "Current rotation" : `${result.changes} season${result.changes === 1 ? "" : "s"} changed`}</strong>
          <span>{result.id === "current" ? "Baseline for comparison" : difference === null ? "" : difference === 0 ? "Same fit score as current" : `${difference > 0 ? "+" : ""}${difference} points vs current`}</span>
        </div>
        <ol className="crop-sequence" aria-label="Crop sequence">
          {result.crops.map((crop, index) => (
            <li key={`${crop}-${index}`}>
              <span aria-hidden="true">{index + 1}</span>
              <strong>{cropLabel(crop)}</strong>
              <small>
                {result.seasons[index].window} ·{" "}
                {Math.round(result.seasons[index].rainMm)} mm rain
              </small>
              {index < result.crops.length - 1 && <i aria-hidden="true" />}
            </li>
          ))}
        </ol>

        <div className="score-grid">
          {keyScores.map((key) => {
            const label = PRIORITIES.find((item) => item.key === key)?.label;
            const value = result.scores[key];
            return (
              <div key={key}>
                <span>{label}</span>
                <strong>
                  {value}{" "}
                  <small className="text-xs font-normal text-muted-foreground">
                    {scoreLevel(value)}
                  </small>
                </strong>
                <div
                  role="meter"
                  aria-label={`${label} score`}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-valuenow={value}
                >
                  <i style={{ width: `${value}%` }} />
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>

      <details className="evidence-details">
        <summary>
          <span>Reasons and local checks</span>
        </summary>
        <div className="evidence-body">
          <h4>Why it fits</h4>
          <ul>
            {result.why.map((reason) => (
              <li key={reason}>{reason}</li>
            ))}
          </ul>
          <h4>NASA evidence</h4>
          <ul>
            {result.evidence.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
          <h4>Check locally</h4>
          <ul>
            {result.risks.map((risk) => (
              <li key={risk}>{risk}</li>
            ))}
          </ul>
          {result.gaps.length > 0 && <><h4>Missing information</h4><ul>{result.gaps.map((gap) => <li key={gap}>{gap}</li>)}</ul></>}
          <h4>Confidence</h4>
          <p>{result.confidenceReason}</p>
        </div>
      </details>

      <section className="evidence-details" aria-labelledby={`rotation-${result.id}-simple`}>
        <div className="evidence-body pt-4">
          <h4 id={`rotation-${result.id}-simple`}>Simplified reasoning</h4>
          <p>{result.simplified.reason}</p>
          <h4>Quick local checks</h4>
          <ul>
            {result.simplified.checks.map((check) => <li key={check}>{check}</li>)}
          </ul>
          {result.gaps.length > 0 && <p className="text-muted-foreground">Still to confirm: {result.gaps.join("; ")}.</p>}
        </div>
      </section>

      <CardFooter>
        <Badge
          variant="secondary"
          className={`confidence ${result.confidence.toLowerCase()}`}
        >
          {result.confidence} confidence
        </Badge>
        <span className="gap-count">
          {result.gaps.length} information gap
          {result.gaps.length === 1 ? "" : "s"}
        </span>
      </CardFooter>
    </Card>
  );
}
