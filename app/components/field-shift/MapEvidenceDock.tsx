import type { ImageryStatus, MapLayerKey } from "../FieldMap";
import { MAP_LAYERS } from "./config";

type MapEvidenceDockProps = {
  mapLayer: MapLayerKey;
  imageryStatus: ImageryStatus;
  onLayerChange: (layer: MapLayerKey) => void;
};

const LAYER_GUIDANCE: Record<Exclude<MapLayerKey, "base">, { takeaway: string; detail: string }> = {
  "ground-heat": {
    takeaway: "Compare warmer and cooler land surfaces across the area.",
    detail: "This is land-surface temperature, not air temperature. Cloud cover can leave gaps, so confirm unusual hotspots locally.",
  },
  "soil-moisture": {
    takeaway: "See broad wet and dry patterns around the field.",
    detail: "SMAP pixels cover several kilometres. Use this as regional context and confirm field moisture with a ground check or sensor.",
  },
  "true-color": {
    takeaway: "View a recent natural-colour satellite image of the area.",
    detail: "Clouds, haze and image date can affect what is visible. Use the field boundary and local observations to confirm current conditions.",
  },
};

function formatImageryDate(date?: string) {
  if (!date) return "date unavailable";
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
  const guidance = mapLayer === "base" ? undefined : LAYER_GUIDANCE[mapLayer];

  return (
    <aside className="map-evidence-dock" aria-label="Map evidence">
      <div className="map-layer-control" role="group" aria-label="Map view">
        <span className="map-layer-label">Map view</span>
        <div className="map-layer-options">
          {MAP_LAYERS.map((layer) => (
            <button key={layer.key} type="button" aria-pressed={mapLayer === layer.key} title={layer.note} onClick={() => onLayerChange(layer.key)}>
              <span className={`layer-key layer-key-${layer.key}`} aria-hidden="true" />
              {layer.label}
            </button>
          ))}
        </div>
      </div>

      {mapLayer !== "base" && (
        <div className="layer-readout">
          <div className="layer-readout-header" role="status" aria-live="polite" aria-atomic="true">
            <span className="nasa-pulse" aria-hidden="true" />
            <div><strong>{activeLayer.label}</strong><small>Observed {formatImageryDate(activeImageryDate)}</small></div>
            <span className="source-chip">NASA</span>
          </div>
          <p className="layer-takeaway">{guidance?.takeaway}</p>
          {mapLayer === "ground-heat" && (
            <div className="heat-ramp" role="img" aria-label="Surface heat colour scale from cooler to hotter"><span>Cooler</span><i /><span>Hotter</span></div>
          )}
          <details className="layer-details">
            <summary>How to use this layer</summary>
            <p>{guidance?.detail}</p>
          </details>
          {imageryStatus.isFallback && <p className="layer-warning">Live imagery dates are unavailable. A recent fallback date is shown.</p>}
        </div>
      )}
    </aside>
  );
}
