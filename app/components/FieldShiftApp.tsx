"use client";

import { useMemo, useState } from "react";
import FieldMap, { type ImageryStatus, type MapLayerKey, type SelectionMode } from "./FieldMap";
import {
  DEFAULT_PRIORITIES,
  DEFAULT_PROFILE,
  buildRotationResults,
  type ClimateSummary,
  type FarmProfile,
  type FieldLocation,
  type ScenarioKey,
} from "../lib/field-shift";
import { locationFromBoundary } from "../lib/geometry";
import { AppOverlays } from "./field-shift/AppOverlays";
import { DISTRICTS, type ResultTab, type Step } from "./field-shift/config";
import { FarmDetailsStep } from "./field-shift/FarmDetailsStep";
import { LocateStep } from "./field-shift/LocateStep";
import { MapEvidenceDock } from "./field-shift/MapEvidenceDock";
import { PrioritiesStep } from "./field-shift/PrioritiesStep";
import { ResultsStep } from "./field-shift/ResultsStep";
import { Brand, Icon, StepProgress } from "./field-shift/SharedUi";

export default function FieldShiftApp() {
  const [step, setStep] = useState<Step>("locate");
  const [detailQuestion, setDetailQuestion] = useState(0);
  const [location, setLocation] = useState<FieldLocation | null>(null);
  const [mapFocus, setMapFocus] = useState<FieldLocation | null>(null);
  const [locating, setLocating] = useState(false);
  const [profile, setProfile] = useState<FarmProfile>(DEFAULT_PROFILE);
  const [priorities, setPriorities] = useState(DEFAULT_PRIORITIES);
  const [climate, setClimate] = useState<ClimateSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [resultTab, setResultTab] = useState<ResultTab>("conditions");
  const [scenario, setScenario] = useState<ScenarioKey>("typical");
  const [mapLayer, setMapLayer] = useState<MapLayerKey>("base");
  const [selectionMode, setSelectionMode] = useState<SelectionMode>("boundary");
  const [imageryStatus, setImageryStatus] = useState<ImageryStatus>({ dates: {}, retrievedAt: null, isFallback: false });
  const [infoOpen, setInfoOpen] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [toast, setToast] = useState("");

  const results = useMemo(
    () => climate ? buildRotationResults(profile, priorities, climate, scenario) : [],
    [climate, priorities, profile, scenario],
  );

  const boundaryPoints = location?.boundary?.length ?? 0;
  const canContinue = Boolean(location && (selectionMode === "pin" || boundaryPoints >= 3));
  const panelTitle = step === "locate" ? "Choose your field" : step === "details" ? "Farm details" : step === "priorities" ? "Choose your goals" : "Field comparison";

  function selectDistrict(value: string) {
    const district = DISTRICTS.find((item) => item.name === value);
    if (district) {
      setSelectionMode("pin");
      setMapFocus(null);
      setLocation(district);
    }
  }

  function focusDistrict(value: string) {
    const district = DISTRICTS.find((item) => item.name === value);
    if (district) setMapFocus(district);
  }

  function useDeviceLocation() {
    if (!navigator.geolocation) {
      setToast("Location access is not available in this browser.");
      return;
    }

    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        setMapFocus({ name: "My location", lat: coords.latitude, lng: coords.longitude });
        setLocating(false);
        setToast("Map centred. Zoom in and tap the field corners.");
        window.setTimeout(() => setToast(""), 2400);
      },
      () => {
        setLocating(false);
        setToast("Location permission was not available. Choose a nearby area instead.");
        window.setTimeout(() => setToast(""), 3000);
      },
      { enableHighAccuracy: true, timeout: 10_000 },
    );
  }

  function chooseSelectionMode(mode: SelectionMode) {
    setSelectionMode(mode);
    setLocation(null);
    setMapFocus(null);
  }

  function undoBoundaryPoint() {
    const points = location?.boundary?.slice(0, -1) ?? [];
    setLocation(points.length ? locationFromBoundary(points) : null);
  }

  function goBack() {
    if (step === "details" && detailQuestion > 0) setDetailQuestion((value) => value - 1);
    else if (step === "details") setStep("locate");
    else if (step === "priorities") {
      setStep("details");
      setDetailQuestion(3);
    } else if (step === "results") setStep("priorities");
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

  return (
    <main className={`app-shell step-${step}`}>
      <a className="skip-link" href="#workspace">Skip to field setup</a>
      <FieldMap
        location={location}
        focusLocation={mapFocus}
        layerKey={mapLayer}
        selectionMode={selectionMode}
        selectionEnabled={step === "locate"}
        onLocationChange={setLocation}
        onImageryStatusChange={setImageryStatus}
      />

      {step === "locate" && (
        <div className="map-callout">
          <span>{selectionMode === "boundary" ? boundaryPoints + 1 : 1}</span>
          <div>
            <strong>{selectionMode === "boundary" ? "Zoom in, then draw your field" : "Tap your field location"}</strong>
            <small>{selectionMode === "boundary" ? "Find your area, then tap each corner. Three or more points make a boundary." : "Place one pin, or choose a known farming area in the panel."}</small>
          </div>
        </div>
      )}
      {location && step !== "results" && (
        <div className="map-selection-badge">
          <Icon name="pin" />
          <div><small>{location.boundary ? `${boundaryPoints} corners · ${location.areaHectares ?? 0} ha` : "Selected location"}</small><strong>{location.name}</strong></div>
        </div>
      )}

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
        {step !== "results" && (
          <div className="panel-intro">
            <p>{step === "locate" ? "Start here" : step === "details" ? `Question ${detailQuestion + 1} of 4 · all optional` : "These choices change the ranking"}</p>
            <h1 id="panel-title">{panelTitle}</h1>
          </div>
        )}

        {step === "locate" && (
          <LocateStep
            location={location}
            mapFocus={mapFocus}
            selectionMode={selectionMode}
            locating={locating}
            boundaryPoints={boundaryPoints}
            canContinue={canContinue}
            onChooseSelectionMode={chooseSelectionMode}
            onFocusDistrict={focusDistrict}
            onSelectDistrict={selectDistrict}
            onUseDeviceLocation={useDeviceLocation}
            onUndoBoundaryPoint={undoBoundaryPoint}
            onClearBoundary={() => setLocation(null)}
            onSelectDemo={setLocation}
            onContinue={() => setStep("details")}
          />
        )}
        {step === "details" && <FarmDetailsStep question={detailQuestion} location={location} profile={profile} setProfile={setProfile} onNext={nextDetail} />}
        {step === "priorities" && <PrioritiesStep priorities={priorities} setPriorities={setPriorities} onCompare={compareRotations} />}
        {step === "results" && (
          <ResultsStep
            location={location}
            climate={climate}
            loading={loading}
            resultTab={resultTab}
            scenario={scenario}
            results={results}
            onEdit={() => setStep("details")}
            onTabChange={setResultTab}
            onScenarioChange={setScenario}
          />
        )}
      </section>

      {step === "results" && <MapEvidenceDock mapLayer={mapLayer} imageryStatus={imageryStatus} onLayerChange={setMapLayer} />}
      <AppOverlays
        infoOpen={infoOpen}
        shareOpen={shareOpen}
        location={location}
        climate={climate}
        results={results}
        toast={toast}
        onCloseInfo={() => setInfoOpen(false)}
        onCloseShare={() => setShareOpen(false)}
        onCopyLink={copyLink}
      />
    </main>
  );
}
