import type { FieldLocation } from "../../lib/field-shift";
import type { SelectionMode } from "../FieldMap";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Icon } from "./SharedUi";

type MapGuidanceOverlayProps = {
  boundaryPoints: number;
  location: FieldLocation | null;
  selectionMode: SelectionMode;
};

export function MapGuidanceOverlay({ boundaryPoints, location, selectionMode }: MapGuidanceOverlayProps) {
  const isBoundary = selectionMode === "boundary";
  const ready = Boolean(location && (!isBoundary || boundaryPoints >= 3));
  const boundarySummary = boundaryPoints < 3
    ? `${boundaryPoints} ${boundaryPoints === 1 ? "corner" : "corners"} · keep marking`
    : `${boundaryPoints} corners · ${(location?.areaHectares ?? 0).toLocaleString()} ha`;

  return (
    <aside className="map-overlay-stack" aria-label="Map guidance">
      <Card className="map-callout">
        <span className="map-guidance-icon"><Icon name={ready ? "check" : "pin"} /></span>
        <div>
          <strong>{ready ? "Your field is ready" : isBoundary ? "Mark your field corners" : "Tap your field location"}</strong>
          <small>{ready ? "Adjust the map selection or continue with this field." : isBoundary ? "Zoom in and tap at least three corners." : "Place one pin for a quick regional estimate."}</small>
        </div>
      {location && (
        <div className="map-selection-badge" role="status" aria-live="polite">
          <div>
            <small>{location.boundary ? boundarySummary : "Location selected"}</small>
            <strong>{location.name}</strong>
          </div>
          <Badge variant={ready ? "default" : "secondary"} className="selection-status">{ready ? "Ready" : `${boundaryPoints}/3`}</Badge>
        </div>
      )}
      </Card>
    </aside>
  );
}
