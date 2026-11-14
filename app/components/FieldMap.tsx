"use client";

import { useEffect, useRef, useState } from "react";
import type {
  GeoJSONSource,
  GeoJSONSourceSpecification,
  Map as MLMap,
  Marker as MLMarker,
} from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { GIBS_LAYERS, gibsTileUrl, isoDaysBefore } from "../lib/gibs";
import type { FieldLocation } from "../lib/field-shift";
import { locationFromBoundary, type FieldCoordinate } from "../lib/geometry";

const SOURCE_ID = "field-shift-overlay";
const LAYER_ID = "field-shift-overlay-layer";
const BOUNDARY_FILL_SOURCE = "selected-field-fill-source";
const BOUNDARY_LINE_SOURCE = "selected-field-line-source";
const BOUNDARY_POINT_SOURCE = "selected-field-point-source";
type GeoJsonData = Exclude<GeoJSONSourceSpecification["data"], string>;

export type MapLayerKey =
  | "base"
  | "true-color"
  | "soil-moisture"
  | "ground-heat";

export type SelectionMode = "pin" | "boundary";
export type ImageryStatus = {
  dates: Partial<Record<Exclude<MapLayerKey, "base">, string>>;
  retrievedAt: string | null;
  isFallback: boolean;
};

const EMPTY_GEOJSON: GeoJsonData = {
  type: "FeatureCollection",
  features: [],
};

function lineData(points: FieldCoordinate[]): GeoJsonData {
  if (points.length < 2) return EMPTY_GEOJSON;
  return {
    type: "Feature",
    properties: {},
    geometry: {
      type: "LineString",
      coordinates: points.length >= 3 ? [...points, points[0]] : points,
    },
  };
}

function fillData(points: FieldCoordinate[]): GeoJsonData {
  if (points.length < 3) return EMPTY_GEOJSON;
  return {
    type: "Feature",
    properties: {},
    geometry: { type: "Polygon", coordinates: [[...points, points[0]]] },
  };
}

function pointData(points: FieldCoordinate[]): GeoJsonData {
  return {
    type: "FeatureCollection",
    features: points.map((coordinates, index) => ({
      type: "Feature",
      properties: { index },
      geometry: { type: "Point", coordinates },
    })),
  };
}

function addBoundaryLayers(map: MLMap) {
  map.addSource(BOUNDARY_FILL_SOURCE, { type: "geojson", data: EMPTY_GEOJSON });
  map.addSource(BOUNDARY_LINE_SOURCE, { type: "geojson", data: EMPTY_GEOJSON });
  map.addSource(BOUNDARY_POINT_SOURCE, { type: "geojson", data: EMPTY_GEOJSON });
  map.addLayer({
    id: "selected-field-fill",
    type: "fill",
    source: BOUNDARY_FILL_SOURCE,
    paint: { "fill-color": "#009966", "fill-opacity": 0.24 },
  });
  map.addLayer({
    id: "selected-field-line",
    type: "line",
    source: BOUNDARY_LINE_SOURCE,
    paint: { "line-color": "#ecfdf5", "line-width": 4 },
  });
  map.addLayer({
    id: "selected-field-line-accent",
    type: "line",
    source: BOUNDARY_LINE_SOURCE,
    paint: { "line-color": "#007a55", "line-width": 2 },
  });
  map.addLayer({
    id: "selected-field-points",
    type: "circle",
    source: BOUNDARY_POINT_SOURCE,
    paint: {
      "circle-radius": 6,
      "circle-color": "#009966",
      "circle-stroke-color": "#ecfdf5",
      "circle-stroke-width": 3,
    },
  });
}

export default function FieldMap({
  location,
  focusLocation = null,
  layerKey = "base",
  selectionMode = "pin",
  selectionEnabled = true,
  onLocationChange,
  onImageryStatusChange,
}: {
  location: FieldLocation | null;
  focusLocation?: FieldLocation | null;
  layerKey?: MapLayerKey;
  selectionMode?: SelectionMode;
  selectionEnabled?: boolean;
  onLocationChange: (location: FieldLocation) => void;
  onImageryStatusChange?: (status: ImageryStatus) => void;
}) {
  const container = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MLMap | null>(null);
  const markerRef = useRef<MLMarker | null>(null);
  const callbackRef = useRef(onLocationChange);
  const locationRef = useRef(location);
  const selectionModeRef = useRef(selectionMode);
  const selectionEnabledRef = useRef(selectionEnabled);
  const imageryCallbackRef = useRef(onImageryStatusChange);
  const [ready, setReady] = useState(false);
  const [imageryStatus, setImageryStatus] = useState<ImageryStatus>({
    dates: {},
    retrievedAt: null,
    isFallback: false,
  });

  useEffect(() => {
    callbackRef.current = onLocationChange;
    locationRef.current = location;
    selectionModeRef.current = selectionMode;
    selectionEnabledRef.current = selectionEnabled;
    imageryCallbackRef.current = onImageryStatusChange;
  }, [location, onImageryStatusChange, onLocationChange, selectionEnabled, selectionMode]);

  useEffect(() => {
    const fallbackDate = isoDaysBefore(new Date(), 5);
    fetch("/api/nasa/gibs")
      .then((response) => {
        if (!response.ok) throw new Error(String(response.status));
        return response.json();
      })
      .then((data: ImageryStatus) => {
        const status = { ...data, isFallback: false };
        setImageryStatus(status);
        imageryCallbackRef.current?.(status);
      })
      .catch(() => {
        const status: ImageryStatus = {
          dates: {
            "true-color": fallbackDate,
            "ground-heat": fallbackDate,
            "soil-moisture": fallbackDate,
          },
          retrievedAt: null,
          isFallback: true,
        };
        setImageryStatus(status);
        imageryCallbackRef.current?.(status);
      });
  }, []);

  useEffect(() => {
    let cancelled = false;
    let map: MLMap | undefined;
    let resizeObserver: ResizeObserver | undefined;
    (async () => {
      const maplibregl = await import("maplibre-gl");
      if (cancelled || !container.current) return;
      maplibregl.setWorkerUrl("/maplibre-gl-worker.mjs");
      map = new maplibregl.Map({
        container: container.current,
        center: [101.2, 4.4],
        zoom: 5.35,
        minZoom: 4,
        maxZoom: 16,
        attributionControl: false,
        style: {
          version: 8,
          sources: {
            osm: {
              type: "raster",
              tiles: ["https://tile.openstreetmap.org/{z}/{x}/{y}.png"],
              tileSize: 256,
              maxzoom: 19,
              attribution: "© OpenStreetMap contributors",
            },
          },
          layers: [
            {
              id: "osm",
              type: "raster",
              source: "osm",
              paint: {
                "raster-saturation": -0.38,
                "raster-contrast": 0.08,
                "raster-brightness-max": 0.92,
              },
            },
          ],
        },
      });
      mapRef.current = map;
      resizeObserver = new ResizeObserver(() => map?.resize());
      resizeObserver.observe(container.current);
      map.addControl(new maplibregl.NavigationControl({ showCompass: false }), "bottom-right");
      map.addControl(new maplibregl.AttributionControl({ compact: true }), "bottom-left");
      map.on("load", () => {
        if (!map) return;
        addBoundaryLayers(map);
        map?.resize();
        setReady(true);
      });
      map.on("click", (event) => {
        if (!selectionEnabledRef.current) return;
        if (selectionModeRef.current === "boundary") {
          const current = locationRef.current?.boundary ?? [];
          const point: FieldCoordinate = [
            Number(event.lngLat.lng.toFixed(6)),
            Number(event.lngLat.lat.toFixed(6)),
          ];
          callbackRef.current(locationFromBoundary([...current, point]));
          return;
        }
        callbackRef.current({
          lat: Number(event.lngLat.lat.toFixed(5)),
          lng: Number(event.lngLat.lng.toFixed(5)),
          name: "Pinned field",
        });
      });
    })();
    return () => {
      cancelled = true;
      resizeObserver?.disconnect();
      markerRef.current?.remove();
      map?.remove();
      mapRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (!ready || !mapRef.current) return;
    const map = mapRef.current;
    if (!location) {
      markerRef.current?.remove();
      markerRef.current = null;
      (map.getSource(BOUNDARY_FILL_SOURCE) as GeoJSONSource).setData(EMPTY_GEOJSON);
      (map.getSource(BOUNDARY_LINE_SOURCE) as GeoJSONSource).setData(EMPTY_GEOJSON);
      (map.getSource(BOUNDARY_POINT_SOURCE) as GeoJSONSource).setData(EMPTY_GEOJSON);
      return;
    }
    const boundary = location.boundary ?? [];
    (map.getSource(BOUNDARY_FILL_SOURCE) as GeoJSONSource).setData(fillData(boundary));
    (map.getSource(BOUNDARY_LINE_SOURCE) as GeoJSONSource).setData(lineData(boundary));
    (map.getSource(BOUNDARY_POINT_SOURCE) as GeoJSONSource).setData(pointData(boundary));

    if (boundary.length > 0) {
      markerRef.current?.remove();
      markerRef.current = null;
      return;
    }
    (async () => {
      const maplibregl = await import("maplibre-gl");
      markerRef.current?.remove();
      const element = document.createElement("div");
      element.className = "field-marker";
      element.setAttribute("aria-label", "Selected field");
      markerRef.current = new maplibregl.Marker({ element })
        .setLngLat([location.lng, location.lat])
        .addTo(map);
      map.flyTo({
        center: [location.lng, location.lat],
        zoom: location.farmId ? 12.2 : Math.max(map.getZoom(), 9),
        duration: 950,
      });
    })();
  }, [location, ready]);

  useEffect(() => {
    if (!ready || !focusLocation || !mapRef.current) return;
    mapRef.current.flyTo({
      center: [focusLocation.lng, focusLocation.lat],
      zoom: 13.5,
      duration: 1_100,
    });
  }, [focusLocation, ready]);

  useEffect(() => {
    if (!ready || !mapRef.current) return;
    mapRef.current.getCanvas().style.cursor =
      selectionEnabled && selectionMode === "boundary" ? "crosshair" : "";
  }, [ready, selectionEnabled, selectionMode]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !ready) return;
    if (map.getLayer(LAYER_ID)) map.removeLayer(LAYER_ID);
    if (map.getSource(SOURCE_ID)) map.removeSource(SOURCE_ID);
    if (layerKey === "base") return;

    const layer = GIBS_LAYERS.find((entry) => entry.key === layerKey);
    const imageryDate = imageryStatus.dates[layerKey];
    if (!layer || !imageryDate) return;
    map.addSource(SOURCE_ID, {
      type: "raster",
      tiles: [gibsTileUrl(layer, imageryDate)],
      tileSize: 256,
      maxzoom: layer.maxZoom,
      attribution: "Imagery: NASA EOSDIS GIBS",
    });
    map.addLayer({
      id: LAYER_ID,
      type: "raster",
      source: SOURCE_ID,
      paint: { "raster-opacity": 0.84 },
    });
  }, [imageryStatus.dates, layerKey, ready]);

  return (
    <div className={`field-map selection-${selectionMode}`} aria-label="Interactive map of Malaysia">
      <div
        ref={container}
        className="field-map-canvas"
        style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}
      />
      {!ready && <div className="map-loading" role="status"><span /> Loading the map…</div>}
      <div className="map-vignette" aria-hidden="true" />
    </div>
  );
}
