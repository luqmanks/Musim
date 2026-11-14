"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { plannerSessionSchema, PLANNER_SESSION_KEY } from "../lib/planner-session";
import { Button } from "@/components/ui/button";
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
import { MapGuidanceOverlay } from "./field-shift/MapGuidanceOverlay";
import { PrioritiesStep } from "./field-shift/PrioritiesStep";
import { ResultsStep } from "./field-shift/ResultsStep";
import { Brand, Icon, StepProgress } from "./field-shift/SharedUi";

export default function FieldShiftApp() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const step: Step = pathname.startsWith("/dashboard/") ? "results" : pathname === "/farm-details" ? "details" : pathname === "/priorities" ? "priorities" : "locate";
  const resultTab: ResultTab = pathname === "/dashboard/climate" ? "conditions" : pathname === "/dashboard/recent-conditions" ? "crops" : "rotations";
  const questionParam = Number(searchParams.get("question") ?? 1);
  const detailQuestion = Number.isInteger(questionParam) ? Math.max(0, Math.min(3, questionParam - 1)) : 0;
  const [sessionReady, setSessionReady] = useState(false);
  function setStep(next: Step) {
    router.push({ locate: "/field", details: "/farm-details", priorities: "/priorities", results: "/dashboard/rotations" }[next]);
  }
  function setDetailQuestion(next: number) { router.push(`/farm-details?question=${next + 1}`); }
  function setResultTab(next: ResultTab) {
    router.push({ rotations: "/dashboard/rotations", conditions: "/dashboard/climate", crops: "/dashboard/recent-conditions" }[next]);
  }
  const [location, setLocation] = useState<FieldLocation | null>(null);
  const [mapFocus, setMapFocus] = useState<FieldLocation | null>(null);
  const [locating, setLocating] = useState(false);
  const [profile, setProfile] = useState<FarmProfile>(DEFAULT_PROFILE);
  const [priorities, setPriorities] = useState(DEFAULT_PRIORITIES);
  const [climate, setClimate] = useState<ClimateSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [climateError, setClimateError] = useState("");
  const [scenario, setScenario] = useState<ScenarioKey>("typical");
  const [mapLayer, setMapLayer] = useState<MapLayerKey>("base");
  const [selectionMode, setSelectionMode] = useState<SelectionMode>("boundary");
  const [imageryStatus, setImageryStatus] = useState<ImageryStatus>({ dates: {}, retrievedAt: null, isFallback: false });
  const [infoOpen, setInfoOpen] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [toast, setToast] = useState("");

  useEffect(() => {
    // Restore only validated inputs; climate is fetched afresh after a reload.
    /* eslint-disable react-hooks/set-state-in-effect */
    try {
      const saved = plannerSessionSchema.safeParse(JSON.parse(sessionStorage.getItem(PLANNER_SESSION_KEY) ?? "null"));
      if (saved.success) {
        setLocation(saved.data.location);
        setProfile(saved.data.profile);
        setPriorities(saved.data.priorities);
        setScenario(saved.data.scenario);
        setSelectionMode(saved.data.selectionMode);
      }
    } catch { /* Storage may be unavailable in private browsing. */ }
    setSessionReady(true);
    /* eslint-enable react-hooks/set-state-in-effect */
  }, []);

  useEffect(() => {
    if (!sessionReady) return;
    try { sessionStorage.setItem(PLANNER_SESSION_KEY, JSON.stringify({ location, profile, priorities, scenario, selectionMode })); }
    catch { /* Navigation still works without persistent storage. */ }
  }, [sessionReady, location, profile, priorities, scenario, selectionMode]);

  const fieldReady = Boolean(location && (selectionMode === "pin" || (location.boundary?.length ?? 0) >= 3));
  useEffect(() => {
    if (sessionReady && step !== "locate" && !fieldReady) router.replace("/field");
  }, [sessionReady, step, fieldReady, router]);

  useEffect(() => {
    if (!sessionReady || step !== "results" || !fieldReady || !location) return;
    const controller = new AbortController();
    /* eslint-disable react-hooks/set-state-in-effect */
    setLoading(true);
    setClimate(null);
    setClimateError("");
    /* eslint-enable react-hooks/set-state-in-effect */
    fetch(`/api/nasa/power?lat=${location.lat}&lng=${location.lng}`, { signal: controller.signal })
      .then(async (response) => {
        const body = await response.json();
        if (!response.ok) throw new Error(body?.error ?? "Climate service unavailable");
        return body;
      })
      .then(setClimate)
      .catch((error: unknown) => { if (!controller.signal.aborted) setClimateError(error instanceof Error ? error.message : "Climate data could not be loaded."); })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [sessionReady, step, fieldReady, location]);

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
    if (step === "details" && detailQuestion > 0) setDetailQuestion(detailQuestion - 1);
    else if (step === "details") setStep("locate");
    else if (step === "priorities") {
      setDetailQuestion(3);
    } else if (step === "results") setStep("priorities");
  }

  function nextDetail() {
    if (detailQuestion < 3) setDetailQuestion(detailQuestion + 1);
    else setStep("priorities");
  }

  function compareRotations() {
    if (fieldReady) setStep("results");
  }

  if (!sessionReady || (step !== "locate" && !fieldReady)) {
    return <div className="p-6 text-sm text-muted-foreground" role="status">Opening your field plan…</div>;
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

      {step === "locate" && <MapGuidanceOverlay boundaryPoints={boundaryPoints} location={location} selectionMode={selectionMode} />}

      {step !== "results" && <header className="topbar">
        <Brand />
        <div className="top-actions">
          <Button className="icon-button" variant="ghost" size="icon" type="button" onClick={() => setInfoOpen(true)} aria-label="About this tool"><Icon name="info" /></Button>
        </div>
      </header>}

      <section id="workspace" className={`workspace-panel ${step === "results" ? "results-panel" : ""}`} aria-labelledby="panel-title">
        {step !== "results" && <StepProgress step={step} />}
        {step !== "locate" && step !== "results" && <Button className="back-button" variant="ghost" type="button" onClick={goBack}><Icon name="back" /> Back</Button>}
        {step !== "results" && (
          <div className="panel-intro">
            <h1 id="panel-title">{panelTitle}</h1>
            <p>{step === "locate" ? "Draw the boundary or place one point." : step === "details" ? `Question ${detailQuestion + 1} of 4 · skip anything you don’t know.` : "Set what matters most on your farm."}</p>
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
            error={climateError}
            resultTab={resultTab}
            scenario={scenario}
            results={results}
            profile={profile}
            onEdit={() => setStep("details")}
            onShare={() => setShareOpen(true)}
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
        profile={profile}
        priorities={priorities}
        scenario={scenario}
      />
    </main>
  );
}
