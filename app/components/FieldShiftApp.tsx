"use client";

import { useMemo, useState } from "react";
import FieldMap, { type MapLayerKey } from "./FieldMap";
import {
  CROPS,
  DEFAULT_PRIORITIES,
  DEFAULT_PROFILE,
  buildRotationResults,
  cropLabel,
  type ClimateSummary,
  type FarmProfile,
  type FieldLocation,
  type PriorityKey,
  type ScenarioKey,
} from "../lib/field-shift";

type Step = "locate" | "details" | "priorities" | "results";
type ResultTab = "conditions" | "rotations";

const DEMO_FARMS: FieldLocation[] = [
  { name: "Kedah paddy demo", lat: 6.1, lng: 100.4, farmId: "demo-b" },
  { name: "Selangor paddy demo", lat: 3.43, lng: 101.18, farmId: "demo-a" },
];

const DISTRICTS: FieldLocation[] = [
  ...DEMO_FARMS,
  { name: "Kota Bharu, Kelantan", lat: 6.1254, lng: 102.2381 },
  { name: "Seberang Perai, Penang", lat: 5.363, lng: 100.4667 },
  { name: "Kota Belud, Sabah", lat: 6.351, lng: 116.43 },
];

const PRIORITIES: Array<{
  key: PriorityKey;
  label: string;
  description: string;
}> = [
  { key: "water", label: "Save water", description: "Prefer crops that cope with less irrigation." },
  { key: "soil", label: "Build soil health", description: "Reward diversity, roots and living cover." },
  { key: "income", label: "Protect income", description: "Keep locally marketable crops in the plan." },
  { key: "erosion", label: "Reduce erosion", description: "Limit bare ground during heavy rain." },
  { key: "nitrogen", label: "Use less nitrogen", description: "Reward nitrogen-fixing legumes." },
  { key: "practicality", label: "Keep it practical", description: "Limit new equipment and major changes." },
];

const SCENARIOS: Array<{ key: ScenarioKey; label: string; note: string }> = [
  { key: "typical", label: "Typical", note: "Five-year NASA climate profile" },
  { key: "dry", label: "Drier", note: "Sensitivity test: lower water availability" },
  { key: "wet", label: "Wetter", note: "Sensitivity test: heavier rain pressure" },
  { key: "hotter", label: "+1 °C", note: "Sensitivity test: hotter conditions" },
];

const MAP_LAYERS: Array<{ key: MapLayerKey; label: string; note: string }> = [
  { key: "base", label: "Field map", note: "OpenStreetMap context" },
  { key: "true-color", label: "Satellite", note: "NASA MODIS true colour" },
  { key: "soil-moisture", label: "Soil moisture", note: "NASA SMAP regional surface soil moisture" },
  { key: "ground-heat", label: "Ground heat", note: "NASA MODIS surface temperature" },
  { key: "field-heat", label: "Field heat sample", note: "ECOSTRESS sample for demo farms" },
];

function Icon({ name }: { name: "info" | "share" | "back" | "pin" | "check" | "close" }) {
  const paths = {
    info: <><circle cx="12" cy="12" r="9" /><path d="M12 11v5M12 8h.01" /></>,
    share: <><circle cx="6" cy="12" r="2" /><circle cx="18" cy="6" r="2" /><circle cx="18" cy="18" r="2" /><path d="m8 11 8-4M8 13l8 4" /></>,
    back: <path d="m15 18-6-6 6-6" />,
    pin: <><path d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Z" /><circle cx="12" cy="10" r="2.5" /></>,
    check: <path d="m5 12 4 4L19 6" />,
    close: <path d="m6 6 12 12M18 6 6 18" />,
  };
  return <svg className="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[name]}</svg>;
}

function Brand() {
  return (
    <div className="brand" aria-label="Musim Field Shift Malaysia">
      <span className="brand-orbit" aria-hidden="true"><span /></span>
      <div>
        <strong>MUSIM</strong>
        <small>Field Shift Malaysia</small>
      </div>
    </div>
  );
}

function StepProgress({ step }: { step: Step }) {
  const active = step === "locate" ? 1 : step === "details" ? 2 : step === "priorities" ? 3 : 4;
  return (
    <div className="journey-progress">
      <span>Step {active} of 4</span>
      <ol className="step-progress" aria-label="Progress">
        {["Choose field", "Farm details", "Your goals", "Compare"].map((label, index) => (
          <li key={label} className={index + 1 <= active ? "active" : ""} aria-current={index + 1 === active ? "step" : undefined}>
            <span>{index + 1 < active ? <Icon name="check" /> : index + 1}</span>
            <small>{label}</small>
          </li>
        ))}
      </ol>
    </div>
  );
}

function ClimateTimeline({ climate }: { climate: ClimateSummary }) {
  const maxRain = Math.max(...climate.monthly.map((month) => month.rainMm), 1);
  return (
    <div className="timeline-card">
      <div className="section-heading compact">
        <div>
          <h3>Season rhythm</h3>
          <p>Typical monthly rainfall and heat across {climate.period}.</p>
        </div>
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

function RotationCard({ result, featured }: { result: ReturnType<typeof buildRotationResults>[number]; featured?: boolean }) {
  const keyScores: PriorityKey[] = ["water", "soil", "income", "erosion"];
  return (
    <article className={`rotation-card ${featured ? "featured" : ""}`}>
      <header>
        <div><span>{result.label}</span><h3>{result.descriptor}</h3></div>
        <div className="overall-score"><strong>{result.total}</strong><small>/100</small></div>
      </header>
      <div className="crop-sequence">
        {result.crops.map((crop, index) => (
          <div key={`${crop}-${index}`}><span>{index + 1}</span><strong>{cropLabel(crop)}</strong>{index < result.crops.length - 1 && <i aria-hidden="true" />}</div>
        ))}
      </div>
      <div className="score-grid">
        {keyScores.map((key) => (
          <div key={key}><span>{PRIORITIES.find((item) => item.key === key)?.label}</span><strong>{result.scores[key]}</strong><div><i style={{ width: `${result.scores[key]}%` }} /></div></div>
        ))}
      </div>
      <details className="evidence-details" open={featured}>
        <summary>Why this score</summary>
        <ul>{result.why.map((reason) => <li key={reason}>{reason}</li>)}</ul>
        <h4>NASA evidence</h4>
        <ul>{result.evidence.map((item) => <li key={item}>{item}</li>)}</ul>
        <h4>Check locally</h4>
        <ul>{result.risks.map((risk) => <li key={risk}>{risk}</li>)}</ul>
      </details>
      <footer>
        <span className={`confidence ${result.confidence.toLowerCase()}`}>{result.confidence} confidence</span>
        <span>{result.gaps.length} information gap{result.gaps.length === 1 ? "" : "s"}</span>
      </footer>
    </article>
  );
}

export default function FieldShiftApp() {
  const [step, setStep] = useState<Step>("locate");
  const [detailQuestion, setDetailQuestion] = useState(0);
  const [location, setLocation] = useState<FieldLocation | null>(null);
  const [profile, setProfile] = useState<FarmProfile>(DEFAULT_PROFILE);
  const [priorities, setPriorities] = useState(DEFAULT_PRIORITIES);
  const [climate, setClimate] = useState<ClimateSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [resultTab, setResultTab] = useState<ResultTab>("conditions");
  const [scenario, setScenario] = useState<ScenarioKey>("typical");
  const [mapLayer, setMapLayer] = useState<MapLayerKey>("base");
  const [infoOpen, setInfoOpen] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [toast, setToast] = useState("");

  const results = useMemo(
    () => climate ? buildRotationResults(profile, priorities, climate, scenario) : [],
    [climate, priorities, profile, scenario],
  );

  function selectDistrict(value: string) {
    const district = DISTRICTS.find((item) => item.name === value);
    if (district) setLocation(district);
  }

  function goBack() {
    if (step === "details" && detailQuestion > 0) setDetailQuestion((value) => value - 1);
    else if (step === "details") setStep("locate");
    else if (step === "priorities") { setStep("details"); setDetailQuestion(3); }
    else if (step === "results") setStep("priorities");
  }

  function nextDetail() {
    if (detailQuestion < 3) setDetailQuestion((value) => value + 1);
    else setStep("priorities");
  }

  async function compareRotations() {
    if (!location) return;
    setStep("results");
    setLoading(true);
    setResultTab("conditions");
    try {
      const response = await fetch(`/api/nasa/power?lat=${location.lat}&lng=${location.lng}`);
      if (!response.ok) throw new Error("Climate service unavailable");
      setClimate(await response.json());
    } catch {
      setToast("Climate data could not be loaded. Return and try again.");
    } finally {
      setLoading(false);
    }
  }

  function copyLink() {
    navigator.clipboard?.writeText(window.location.href);
    setToast("App link copied");
    window.setTimeout(() => setToast(""), 2400);
  }

  const panelTitle = step === "locate" ? "Choose your field" : step === "details" ? "Farm details" : step === "priorities" ? "Choose your goals" : "Field comparison";

  return (
    <main className={`app-shell step-${step}`}>
      <a className="skip-link" href="#workspace">Skip to field setup</a>
      <FieldMap location={location} layerKey={mapLayer} onLocationChange={setLocation} />
      {step === "locate" && !location && <div className="map-callout"><span>1</span><div><strong>Tap anywhere on the map</strong><small>Place a field pin, or choose a demo farm in the panel.</small></div></div>}
      {location && step !== "results" && <div className="map-selection-badge"><Icon name="pin" /><div><small>Selected field</small><strong>{location.name}</strong></div></div>}

      <header className="topbar">
        <Brand />
        <div className="top-actions">
          <span className="language-button" aria-label="English interface; Bahasa Melayu planned">EN <span>· BM soon</span></span>
          <button className="icon-button" type="button" onClick={() => setInfoOpen(true)} aria-label="About this tool"><Icon name="info" /></button>
          {step === "results" && <button className="share-button" type="button" onClick={() => setShareOpen(true)}><Icon name="share" /> Save & share</button>}
        </div>
      </header>

      <section id="workspace" className={`workspace-panel ${step === "results" ? "results-panel" : ""}`} aria-labelledby="panel-title">
        {step !== "results" && <StepProgress step={step} />}
        {step !== "locate" && step !== "results" && <button className="back-button" type="button" onClick={goBack}><Icon name="back" /> Back</button>}
        <div className="panel-intro">
          <p>{step === "locate" ? "Start here" : step === "details" ? `Question ${detailQuestion + 1} of 4 · all optional` : step === "priorities" ? "These choices change the ranking" : location?.name}</p>
          <h1 id="panel-title">{panelTitle}</h1>
        </div>

        {step === "locate" && (
          <div className="locate-content">
            <div className="instruction-card"><span>1</span><p><strong>Select one field.</strong> Tap the map, choose a Malaysian area, or use a ready-made demo.</p></div>
            <label className="field-label" htmlFor="district-select">Choose a place</label>
            <select id="district-select" name="district" autoComplete="off" className="select-control" value={location?.name ?? ""} onChange={(event) => selectDistrict(event.target.value)}>
              <option value="">Choose a Malaysian farming area</option>
              {DISTRICTS.map((district) => <option key={district.name}>{district.name}</option>)}
            </select>
            <div className="or-divider"><span>or try a demo</span></div>
            <div className="demo-grid">
              {DEMO_FARMS.map((farm) => (
                <button type="button" key={farm.name} className={location?.farmId === farm.farmId ? "demo-farm selected" : "demo-farm"} onClick={() => setLocation(farm)}>
                  <span className="demo-map-pattern" aria-hidden="true" />
                  <strong>{farm.name.replace(" demo", "")}</strong>
                  <small>{farm.name.startsWith("Kedah") ? "Paddy · MADA region" : "Paddy · Selangor"}</small>
                </button>
              ))}
            </div>
            {location && <div className="selected-location"><Icon name="pin" /><div><strong>{location.name}</strong><span>{location.lat.toFixed(4)}, {location.lng.toFixed(4)}</span></div><span className="status-dot">Selected</span></div>}
            <button className="primary-button" type="button" disabled={!location} onClick={() => setStep("details")}>Describe this farm</button>
            <p className="map-hint">You can also tap anywhere on the map to place a field pin.</p>
          </div>
        )}

        {step === "details" && (
          <div className="question-content">
            <div className="selected-field-inline"><Icon name="pin" /><span><small>Working with</small><strong>{location?.name}</strong></span></div>
            {detailQuestion === 0 && <>
              <h2>What is your current rotation?</h2><p>Choose up to three consecutive seasons.</p>
              <div className="rotation-inputs">{profile.rotation.map((crop, index) => <label key={index}><span>Season {index + 1}</span><select name={`rotation-season-${index + 1}`} autoComplete="off" value={crop} onChange={(event) => setProfile((current) => ({ ...current, rotation: current.rotation.map((item, itemIndex) => itemIndex === index ? event.target.value : item) }))}>{CROPS.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}</select></label>)}</div>
            </>}
            {detailQuestion === 1 && <>
              <h2>How would you describe the soil?</h2><p>If you are unsure, we record this as an information gap.</p>
              <div className="choice-list">{[["unknown", "I don’t know", "We will lower confidence"], ["clay-poor", "Clay · slow drainage", "Water stays after heavy rain"], ["loam", "Loam · moderate drainage", "Balanced texture and drainage"], ["sandy", "Sandy · fast drainage", "Dries quickly after rain"], ["peat", "Peat or organic soil", "High organic matter"]].map(([value, label, note]) => <button type="button" key={value} className={profile.soil === value ? "choice selected" : "choice"} onClick={() => setProfile((current) => ({ ...current, soil: value }))}><span>{label}<small>{note}</small></span><i /></button>)}</div>
            </>}
            {detailQuestion === 2 && <>
              <h2>How reliable is field water?</h2><p>Think about irrigation and usable water during dry weeks.</p>
              <div className="choice-list">{[["reliable", "Reliable", "Irrigation is usually available"], ["seasonal", "Seasonal", "Availability changes through the year"], ["limited", "Limited", "Dry periods often restrict planting"], ["unknown", "I don’t know", "Add this to the expert checklist"]].map(([value, label, note]) => <button type="button" key={value} className={profile.water === value ? "choice selected" : "choice"} onClick={() => setProfile((current) => ({ ...current, water: value }))}><span>{label}<small>{note}</small></span><i /></button>)}</div>
            </>}
            {detailQuestion === 3 && <>
              <h2>What could limit a new crop?</h2><p>These answers prevent unrealistic suggestions.</p>
              <label className="field-label">Equipment<select name="equipment" autoComplete="off" className="select-control" value={profile.equipment} onChange={(event) => setProfile((current) => ({ ...current, equipment: event.target.value }))}><option value="standard">Standard paddy equipment</option><option value="flexible">Equipment for several crops</option><option value="manual">Mostly manual</option><option value="unknown">I don’t know</option></select></label>
              <label className="field-label">Market access<select name="market-access" autoComplete="off" className="select-control" value={profile.market} onChange={(event) => setProfile((current) => ({ ...current, market: event.target.value }))}><option value="local">Local buyers available</option><option value="contract">Contract buyer</option><option value="limited">Limited buyers</option><option value="unknown">I don’t know</option></select></label>
            </>}
            <div className="question-actions"><button className="text-button" type="button" onClick={nextDetail}>Skip for now</button><button className="primary-button" type="button" onClick={nextDetail}>{detailQuestion === 3 ? "Set priorities" : "Next question"}</button></div>
          </div>
        )}

        {step === "priorities" && (
          <div className="priority-content">
            <div className="instruction-card"><span>3</span><p><strong>Set what matters most.</strong> Move each slider from helpful to essential, then compare the rotations.</p></div>
            <div className="priority-list">{PRIORITIES.map((priority) => <label key={priority.key} className="priority-row"><span><strong>{priority.label}</strong><small>{priority.description}</small></span><input type="range" min="1" max="5" step="1" value={priorities[priority.key]} onChange={(event) => setPriorities((current) => ({ ...current, [priority.key]: Number(event.target.value) }))} aria-label={`${priority.label} priority`} /><output>{priorities[priority.key] === 5 ? "Essential" : priorities[priority.key] >= 3 ? "Important" : "Helpful"}</output></label>)}</div>
            <button className="primary-button" type="button" onClick={compareRotations}>Compare rotations</button>
          </div>
        )}

        {step === "results" && (
          <div className="results-content">
            <div className="result-header">
              <div><span className="location-kicker"><Icon name="pin" /> {location?.name}</span><h1>Field outlook</h1></div>
              <button className="edit-button" type="button" onClick={() => setStep("details")}>Edit my answers</button>
            </div>
            <div className="result-tabs" role="tablist" aria-label="Result views"><button role="tab" aria-selected={resultTab === "conditions"} onClick={() => setResultTab("conditions")}>Conditions</button><button role="tab" aria-selected={resultTab === "rotations"} onClick={() => setResultTab("rotations")}>Rotations</button></div>
            {loading && <div className="loading-state" role="status"><span className="loading-orbit" /><h2>Reading the field from space</h2><p>Building a five-year climate profile from NASA POWER…</p></div>}
            {!loading && climate && resultTab === "conditions" && <div className="conditions-view">
              {climate.isFallback && <div className="data-warning"><strong>Demonstration climate shown</strong><span>The live NASA request was unavailable. Scores are clearly marked as lower confidence.</span></div>}
              <div className="metric-row"><div><span>Typical rainfall</span><strong>{Math.round(climate.annualRainMm).toLocaleString()} <small>mm/yr</small></strong></div><div><span>Average temperature</span><strong>{climate.meanTempC.toFixed(1)} <small>°C</small></strong></div><div><span>Wettest month</span><strong>{climate.wettestMonth}</strong></div><div><span>Drier months</span><strong>{climate.dryMonths}</strong></div></div>
              <div className="insight-callout"><span aria-hidden="true">↳</span><p><strong>{climate.wettestMonth} carries the strongest heavy-rain pressure.</strong> Avoid leaving the field bare when erosion exposure is highest.</p></div>
              <ClimateTimeline climate={climate} />
              <div className="provenance-card"><div><span>Source</span><strong>{climate.source}</strong></div><div><span>Period</span><strong>{climate.period}</strong></div><div><span>Spatial context</span><strong>{climate.resolution}</strong></div><a href={climate.sourceUrl} target="_blank" rel="noreferrer">Open NASA source</a></div>
              <button className="primary-button" type="button" onClick={() => setResultTab("rotations")}>See rotation options</button>
            </div>}
            {!loading && climate && resultTab === "rotations" && <div className="rotations-view">
              <div className="scenario-control"><div><strong>Stress-test the plan</strong><span>{SCENARIOS.find((item) => item.key === scenario)?.note}</span></div><div>{SCENARIOS.map((item) => <button key={item.key} type="button" aria-pressed={scenario === item.key} onClick={() => setScenario(item.key)}>{item.label}</button>)}</div></div>
              <div className="rotation-cards">{results.map((result) => <RotationCard key={result.id} result={result} featured={result.id === "conservative"} />)}</div>
              <p className="decision-note">These comparisons support a conversation. Confirm crop timing, drainage, seed access and prices with a local agricultural officer before changing your rotation.</p>
            </div>}
          </div>
        )}
      </section>

      {step === "results" && <div className="map-layer-control"><span>Map evidence</span>{MAP_LAYERS.map((layer) => <button key={layer.key} type="button" aria-pressed={mapLayer === layer.key} title={layer.note} onClick={() => setMapLayer(layer.key)}>{layer.label}</button>)}</div>}

      {infoOpen && <div className="modal-backdrop" role="presentation" onMouseDown={() => setInfoOpen(false)}><section className="modal-card" role="dialog" aria-modal="true" aria-labelledby="about-title" onMouseDown={(event) => event.stopPropagation()}><button className="modal-close" type="button" onClick={() => setInfoOpen(false)} aria-label="Close"><Icon name="close" /></button><span className="modal-mark">M</span><h2 id="about-title">A rehearsal, not a prescription</h2><p>Musim combines NASA Earth observations, farm details and your priorities to compare possible crop rotations.</p><p>It does not measure conditions directly on your field or replace local agronomic advice. Every result shows its evidence, assumptions and information gaps.</p><button className="primary-button" type="button" onClick={() => setInfoOpen(false)}>I understand</button></section></div>}

      {shareOpen && <div className="drawer-backdrop" role="presentation" onMouseDown={() => setShareOpen(false)}><aside className="share-drawer" role="dialog" aria-modal="true" aria-labelledby="share-title" onMouseDown={(event) => event.stopPropagation()}><button className="modal-close" type="button" onClick={() => setShareOpen(false)} aria-label="Close"><Icon name="close" /></button><p>Expert handoff</p><h2 id="share-title">Save this field comparison</h2><div className="report-preview"><Brand /><span>{location?.name}</span><strong>{results[1]?.descriptor ?? "Rotation comparison"}</strong><small>{climate?.source} · {climate?.period}</small></div><div className="expert-checklist"><h3>Ask a local expert</h3><ul>{Array.from(new Set(results.flatMap((result) => [...result.risks, ...result.gaps]))).slice(0, 5).map((item) => <li key={item}>{item}</li>)}</ul></div><button className="primary-button" type="button" onClick={() => window.print()}>Print or save as PDF</button><button className="secondary-button" type="button" onClick={copyLink}>Copy app link</button><p className="drawer-footnote">Confirm with a local expert before changing your rotation.</p></aside></div>}
      {toast && <div className="toast" role="status">{toast}</div>}
    </main>
  );
}

