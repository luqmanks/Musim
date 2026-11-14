import type { ImageryStatus, MapLayerKey } from "../FieldMap";
import { MAP_LAYERS } from "./config";

type MapEvidenceDockProps = {
  mapLayer: MapLayerKey;
  imageryStatus: ImageryStatus;
  onLayerChange: (layer: MapLayerKey) => void;
};

function formatImageryDate(date?: string) {
  if (!date) return "Date unavailable";
  return new Date(`${date}T00:00:00Z`).toLocaleDateString("en-MY", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });
}

export function MapEvidenceDock({ mapLayer, imageryStatus, onLayerChange }: MapEvidenceDockProps) {
  const activeLayer = MAP_LAYERS.find((layer) => layer.key === mapLayer) ?? MAP_LAYERS[0];
  const activeImageryDate = mapLayer === "base" ? undefined : imageryStatus.dates[mapLayer];

  return (
    <aside className="map-evidence-dock" aria-label="NASA map evidence">
      <div className="map-layer-control">
        <span>Map evidence</span>
        {MAP_LAYERS.map((layer) => <button key={layer.key} type="button" aria-pressed={mapLayer === layer.key} title={layer.note} onClick={() => onLayerChange(layer.key)}>{layer.label}</button>)}
      </div>
      {mapLayer !== "base" && (
        <div className="layer-readout" aria-live="polite">
          <div><span className="nasa-pulse" /> <strong>{activeLayer.label}</strong><small>NASA EOSDIS GIBS · {formatImageryDate(activeImageryDate)}</small></div>
          {mapLayer === "ground-heat" && <><div className="heat-ramp" role="img" aria-label="Surface heat colour scale from cooler to hotter"><span>Cooler</span><i /><span>Hotter</span></div><p>Near-real-time land-surface temperature. This is ground heat, not air temperature; clouds can leave gaps.</p></>}
          {mapLayer === "soil-moisture" && <p>Latest available regional SMAP view. One pixel covers several kilometres, so use it as context—not a field sensor.</p>}
          {imageryStatus.isFallback && <p className="layer-warning">The live date service is unavailable; a recent fallback date is shown.</p>}
        </div>
      )}
    </aside>
  );
}
