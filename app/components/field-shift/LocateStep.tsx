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
      <div className="selection-mode" aria-label="Field selection method">
        <button type="button" aria-pressed={selectionMode === "boundary"} onClick={() => onChooseSelectionMode("boundary")}>
          <strong>Draw my field</strong><small>Closer context for this field</small>
        </button>
        <button type="button" aria-pressed={selectionMode === "pin"} onClick={() => onChooseSelectionMode("pin")}>
          <strong>Place one point</strong><small>Quick regional estimate</small>
        </button>
      </div>

      {selectionMode === "boundary" ? (
        <>
          <div className="field-finder">
            <label htmlFor="boundary-area-select">
              Find your area
              <select id="boundary-area-select" name="boundary-area" autoComplete="off" value={mapFocus?.name ?? ""} onChange={(event) => onFocusDistrict(event.target.value)}>
                <option value="">Zoom near a farming area…</option>
                {DISTRICTS.map((district) => <option key={district.name}>{district.name}</option>)}
              </select>
            </label>
            <button type="button" onClick={onUseDeviceLocation} disabled={locating}>{locating ? "Finding…" : "Use my location"}</button>
          </div>
          <div className="instruction-card">
            <span>{Math.min(boundaryPoints + 1, 3)}</span>
            <p><strong>Tap each corner of your field.</strong> After three points, the map closes the shape. Add more points for a closer outline.</p>
          </div>
          <div className="boundary-status" aria-live="polite">
            <div><span>Boundary</span><strong>{boundaryPoints < 3 ? `${boundaryPoints} of 3 minimum points` : `${boundaryPoints} corners mapped`}</strong></div>
            <div><span>Estimated area</span><strong>{boundaryPoints >= 3 ? `${location?.areaHectares?.toLocaleString()} ha` : "—"}</strong></div>
          </div>
          <div className="boundary-actions">
            <button type="button" disabled={boundaryPoints === 0} onClick={onUndoBoundaryPoint}>Undo last point</button>
            <button type="button" disabled={boundaryPoints === 0} onClick={onClearBoundary}>Clear boundary</button>
          </div>
        </>
      ) : (
        <>
          <div className="instruction-card"><span>1</span><p><strong>Tap your field on the map</strong> or choose a nearby Malaysian farming area below.</p></div>
          <label className="field-label" htmlFor="district-select">Choose a place</label>
          <select id="district-select" name="district" autoComplete="off" className="select-control" value={location?.name ?? ""} onChange={(event) => onSelectDistrict(event.target.value)}>
            <option value="">Choose a Malaysian farming area</option>
            {DISTRICTS.map((district) => <option key={district.name}>{district.name}</option>)}
          </select>
          <div className="or-divider"><span>or try a demo</span></div>
          <div className="demo-grid">
            {DEMO_FARMS.map((farm) => (
              <button type="button" key={farm.name} className={location?.farmId === farm.farmId ? "demo-farm selected" : "demo-farm"} onClick={() => onSelectDemo(farm)}>
                <span className="demo-map-pattern" aria-hidden="true" />
                <strong>{farm.name.replace(" demo", "")}</strong>
                <small>{farm.name.startsWith("Kedah") ? "Paddy · MADA region" : "Paddy · Selangor"}</small>
              </button>
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
          <span className="status-dot">Selected</span>
        </div>
      )}
      <div className="step-footer">
        <button className="primary-button" type="button" disabled={!canContinue} onClick={onContinue}>
          {selectionMode === "boundary" ? "Use this field area" : "Use this location"}
        </button>
      </div>
    </div>
  );
}
