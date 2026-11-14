"use client";

import { useEffect, useRef, useState } from "react";
import type { Map as MLMap, Marker as MLMarker } from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { GIBS_LAYERS, gibsTileUrl, isoDaysBefore } from "../lib/gibs";
import { FIELD_HEAT_KEY, type DemoFarm, type EcostressScene } from "../lib/ecostress";
import type { FieldLocation } from "../lib/field-shift";

const SOURCE_ID = "field-shift-overlay";
const LAYER_ID = "field-shift-overlay-layer";

export type MapLayerKey =
  | "base"
  | "true-color"
  | "soil-moisture"
  | "ground-heat"
  | "field-heat";

export default function FieldMap({
  location,
  layerKey = "base",
  onLocationChange,
}: {
  location: FieldLocation | null;
  layerKey?: MapLayerKey;
  onLocationChange: (location: FieldLocation) => void;
}) {
  const container = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MLMap | null>(null);
  const markerRef = useRef<MLMarker | null>(null);
  const callbackRef = useRef(onLocationChange);
  const [ready, setReady] = useState(false);
  const [farms, setFarms] = useState<DemoFarm[]>([]);
  const [scene, setScene] = useState<EcostressScene | null>(null);
  const [imageryDate, setImageryDate] = useState<string | null>(null);

  useEffect(() => {
    callbackRef.current = onLocationChange;
  }, [onLocationChange]);

  useEffect(() => {
    const clock = window.setTimeout(
      () => setImageryDate(isoDaysBefore(new Date(), 5)),
      0,
    );
    fetch("/data/farms/index.json")
      .then((response) => (response.ok ? response.json() : []))
      .then((data: DemoFarm[]) => setFarms(data))
      .catch(() => setFarms([]));
    return () => window.clearTimeout(clock);
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
        map?.resize();
        setReady(true);
      });
      map.on("click", (event) => {
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
    if (!ready || !location || !mapRef.current) return;
    const map = mapRef.current;
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
    if (layerKey !== FIELD_HEAT_KEY || !location?.farmId) return;
    const farm = farms.find((entry) => entry.id === location.farmId);
    if (!farm) return;
    fetch(farm.scene)
      .then((response) => {
        if (!response.ok) throw new Error(String(response.status));
        return response.json();
      })
      .then((data: EcostressScene) => setScene(data))
      .catch(() => setScene(null));
  }, [farms, layerKey, location?.farmId]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !ready) return;
    if (map.getLayer(LAYER_ID)) map.removeLayer(LAYER_ID);
    if (map.getSource(SOURCE_ID)) map.removeSource(SOURCE_ID);
    if (layerKey === "base") return;

    if (
      layerKey === FIELD_HEAT_KEY &&
      scene &&
      scene.farmId === location?.farmId
    ) {
      const [west, south, east, north] = scene.bounds;
      map.addSource(SOURCE_ID, {
        type: "image",
        url: scene.image,
        coordinates: [[west, north], [east, north], [east, south], [west, south]],
      });
      map.addLayer({
        id: LAYER_ID,
        type: "raster",
        source: SOURCE_ID,
        paint: { "raster-opacity": 0.78, "raster-resampling": "nearest" },
      });
      return;
    }

    const layer = GIBS_LAYERS.find((entry) => entry.key === layerKey);
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
  }, [imageryDate, layerKey, location?.farmId, ready, scene]);

  return (
    <div className="field-map" aria-label="Interactive map of Malaysia">
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
