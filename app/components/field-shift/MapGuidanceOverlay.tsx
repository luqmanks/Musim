import type { FieldLocation } from "../../lib/field-shift";
import type { SelectionMode } from "../FieldMap";
import { Icon } from "./SharedUi";

type MapGuidanceOverlayProps = {
  boundaryPoints: number;
  location: FieldLocation | null;
  selectionMode: SelectionMode;
};

export function MapGuidanceOverlay({ boundaryPoints, location, selectionMode }: MapGuidanceOverlayProps) {
  const isBoundary = selectionMode === "boundary";
  const boundarySummary = boundaryPoints < 3
    ? `${boundaryPoints} ${boundaryPoints === 1 ? "corner" : "corners"} · keep marking`
    : `${boundaryPoints} corners · ${(location?.areaHectares ?? 0).toLocaleString()} ha`;

  return (
    <aside className="map-overlay-stack" aria-label="Map guidance">
      <div className="map-callout">
        <span aria-hidden="true">{isBoundary ? boundaryPoints + 1 : 1}</span>
        <div>
          <strong>{isBoundary ? "Zoom in, then mark each corner" : "Tap your field location"}</strong>
          <small>{isBoundary ? "Start at one corner and work around the field. Three points close the boundary." : "Place one pin for a quick regional estimate."}</small>
        </div>
      </div>

      {location && (
        <div className="map-selection-badge" role="status" aria-live="polite">
          <Icon name="pin" />
          <div>
            <small>{location.boundary ? boundarySummary : "Location selected"}</small>
            <strong>{location.name}</strong>
          </div>
          <span className="selection-status">Selected</span>
        </div>
      )}
    </aside>
  );
}
