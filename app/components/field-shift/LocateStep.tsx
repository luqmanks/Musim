import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { FieldLocation } from "../../lib/field-shift";
import type { SelectionMode } from "../FieldMap";
import { DEMO_FARMS, DISTRICTS } from "./config";
import { Icon } from "./SharedUi";

type LocateStepProps = {
  location: FieldLocation | null;
  mapFocus: FieldLocation | null;
  selectionMode: SelectionMode;
  locating: boolean;
  boundaryPoints: number;
  canContinue: boolean;
  onChooseSelectionMode: (mode: SelectionMode) => void;
  onFocusDistrict: (value: string) => void;
  onSelectDistrict: (value: string) => void;
  onUseDeviceLocation: () => void;
  onUndoBoundaryPoint: () => void;
  onClearBoundary: () => void;
  onSelectDemo: (farm: FieldLocation) => void;
  onContinue: () => void;
};

export function LocateStep({
  location,
  mapFocus,
  selectionMode,
  locating,
  boundaryPoints,
  canContinue,
  onChooseSelectionMode,
  onFocusDistrict,
  onSelectDistrict,
  onUseDeviceLocation,
  onUndoBoundaryPoint,
  onClearBoundary,
  onSelectDemo,
  onContinue,
}: LocateStepProps) {
  return (
    <div className="locate-content">
      <Tabs value={selectionMode} onValueChange={(value) => onChooseSelectionMode(value as SelectionMode)}>
        <TabsList className="selection-mode" aria-label="Field selection method">
          <TabsTrigger value="boundary" className="selection-mode-trigger">
            <span><strong>Draw field</strong><small>Most accurate</small></span>
          </TabsTrigger>
          <TabsTrigger value="pin" className="selection-mode-trigger">
            <span><strong>Place point</strong><small>Quick estimate</small></span>
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {selectionMode === "boundary" ? (
        <>
          <div className="field-finder">
            <label>
              Find your area
              <Select value={mapFocus?.name ?? ""} onValueChange={onFocusDistrict}>
                <SelectTrigger id="boundary-area-select" className="shadcn-select"><SelectValue placeholder="Choose a farming area" /></SelectTrigger>
                <SelectContent>{DISTRICTS.map((district) => <SelectItem key={district.name} value={district.name}>{district.name}</SelectItem>)}</SelectContent>
              </Select>
            </label>
            <Button type="button" variant="outline" size="lg" onClick={onUseDeviceLocation} disabled={locating}>{locating ? "Finding…" : "Use location"}</Button>
          </div>
          <p className="step-note"><strong>Tap each field corner.</strong> The boundary closes after three points.</p>
          <div className="boundary-status" aria-live="polite">
            <div><span>Boundary</span><strong>{boundaryPoints < 3 ? `${boundaryPoints} of 3 minimum points` : `${boundaryPoints} corners mapped`}</strong></div>
            <div><span>Estimated area</span><strong>{boundaryPoints >= 3 ? `${location?.areaHectares?.toLocaleString()} ha` : "—"}</strong></div>
          </div>
          <div className="boundary-actions">
            <Button type="button" variant="ghost" disabled={boundaryPoints === 0} onClick={onUndoBoundaryPoint}>Undo</Button>
            <Button type="button" variant="ghost" disabled={boundaryPoints === 0} onClick={onClearBoundary}>Clear</Button>
          </div>
        </>
      ) : (
        <>
          <p className="step-note"><strong>Tap the map</strong> or choose a nearby farming area.</p>
          <label className="field-label">Choose a place
            <Select value={location?.name ?? ""} onValueChange={onSelectDistrict}>
              <SelectTrigger id="district-select" className="shadcn-select"><SelectValue placeholder="Choose a Malaysian farming area" /></SelectTrigger>
              <SelectContent>{DISTRICTS.map((district) => <SelectItem key={district.name} value={district.name}>{district.name}</SelectItem>)}</SelectContent>
            </Select>
          </label>
          <div className="or-divider"><span>or try a demo</span></div>
          <div className="demo-grid">
            {DEMO_FARMS.map((farm) => (
              <Button type="button" variant="outline" key={farm.name} className={location?.farmId === farm.farmId ? "demo-farm selected" : "demo-farm"} onClick={() => onSelectDemo(farm)}>
                <span className="demo-map-pattern" aria-hidden="true" />
                <strong>{farm.name.replace(" demo", "")}</strong>
                <small>{farm.name.startsWith("Kedah") ? "Paddy · MADA region" : "Paddy · Selangor"}</small>
              </Button>
            ))}
          </div>
        </>
      )}

      {location && (
        <div className="selected-location">
          <Icon name="pin" />
          <div>
            <strong>{location.name}</strong>
            <span>{location.boundary ? `${(location.areaHectares ?? 0).toLocaleString()} ha · centre ${location.lat.toFixed(4)}, ${location.lng.toFixed(4)}` : `${location.lat.toFixed(4)}, ${location.lng.toFixed(4)}`}</span>
          </div>
        </div>
      )}
      <div className="step-footer">
        <Button className="step-primary" size="lg" type="button" disabled={!canContinue} onClick={onContinue}>
          {selectionMode === "boundary" ? "Use this field area" : "Use this location"}
        </Button>
      </div>
    </div>
  );
}
