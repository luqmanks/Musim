"use client";

import { useEffect, useRef, useState } from "react";
import type { Map as MLMap, Marker as MLMarker } from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { GIBS_LAYERS, gibsTileUrl, isoDaysBefore } from "../lib/gibs";

export type FieldLocation = { lng: number; lat: number };

const SRC = "gibs";
const LAYER = "gibs-layer";
const DAYS_BACK = 60; // scrubber range
const DEFAULT_LAG = 3; // GIBS imagery usually lags a few days

export default function FieldMap({
  onLocationChange,
}: {
  onLocationChange?: (p: FieldLocation) => void;
}) {
  const container = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MLMap | null>(null);
  const markerRef = useRef<MLMarker | null>(null);
  const onLocationRef = useRef(onLocationChange);
  const [ready, setReady] = useState(false);
  const [layerKey, setLayerKey] = useState(GIBS_LAYERS[0].key);
  // Read the clock after mount: Next "cacheComponents" forbids new Date() during prerender.
  const [today, setToday] = useState<Date | null>(null);
  const [step, setStep] = useState(DAYS_BACK - DEFAULT_LAG); // right = newest

  useEffect(() => {
    onLocationRef.current = onLocationChange;
  }, [onLocationChange]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setToday(new Date());
  }, []);

  const layer = GIBS_LAYERS.find((l) => l.key === layerKey) ?? GIBS_LAYERS[0];
  const date = today ? isoDaysBefore(today, DAYS_BACK - step) : null;

  // Create the map once (maplibre-gl is imported lazily so SSR never touches it).
  useEffect(() => {
    let cancelled = false;
    let map: MLMap | undefined;

    (async () => {
      const maplibregl = await import("maplibre-gl");
      if (cancelled || !container.current) return;

      // Serve the worker from /public (see scripts/copy-maplibre-worker.mjs).
      maplibregl.setWorkerUrl("/maplibre-gl-worker.mjs");

      const m = new maplibregl.Map({
        container: container.current,
        center: [20, 10],
        zoom: 1.8,
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
          layers: [{ id: "osm", type: "raster", source: "osm" }],
        },
      });
      map = m;
      mapRef.current = m;
      m.addControl(new maplibregl.NavigationControl(), "top-right");
      m.addControl(
        new maplibregl.GeolocateControl({
          positionOptions: { enableHighAccuracy: true },
        }),
        "top-right",
      );
      m.on("load", () => setReady(true));
      m.on("click", (e) => {
        if (!markerRef.current) {
          markerRef.current = new maplibregl.Marker()
            .setLngLat(e.lngLat)
            .addTo(m);
        } else {
          markerRef.current.setLngLat(e.lngLat);
        }
        onLocationRef.current?.({ lng: e.lngLat.lng, lat: e.lngLat.lat });
      });
    })();

    return () => {
      cancelled = true;
      markerRef.current?.remove();
      markerRef.current = null;
      map?.remove();
      mapRef.current = null;
    };
  }, []);

  // (Re)add the GIBS overlay when the layer or date changes (debounced for the scrubber).
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !ready || !date) return;
    const t = setTimeout(() => {
      if (map.getLayer(LAYER)) map.removeLayer(LAYER);
      if (map.getSource(SRC)) map.removeSource(SRC);
      map.addSource(SRC, {
        type: "raster",
        tiles: [gibsTileUrl(layer, date)],
        tileSize: 256,
        maxzoom: layer.maxZoom,
        attribution: "Imagery: NASA EOSDIS GIBS",
      });
      map.addLayer({
        id: LAYER,
        type: "raster",
        source: SRC,
        paint: { "raster-opacity": 0.9 },
      });
    }, 250);
    return () => clearTimeout(t);
  }, [layer, date, ready]);

  const prettyDate = date
    ? new Date(date + "T00:00:00Z").toLocaleDateString(undefined, {
        day: "numeric",
        month: "short",
        year: "numeric",
        timeZone: "UTC",
      })
    : "…";

  return (
    <div className="relative h-full min-h-[420px] w-full">
      {/* Inline style on purpose: maplibre-gl.css sets .maplibregl-map { position: relative },
          which would override a Tailwind "absolute inset-0" class and collapse the map to 0px tall. */}
      <div ref={container} style={{ position: "absolute", inset: 0 }} />

      <div className="absolute left-3 top-3 flex w-72 max-w-[calc(100%-5rem)] flex-col gap-3 rounded-xl bg-white/95 p-3 text-sm text-zinc-900 shadow-lg dark:bg-zinc-900/95 dark:text-zinc-50">
        <div className="flex flex-wrap gap-2" role="group" aria-label="Map layer">
          {GIBS_LAYERS.map((l) => (
            <button
              key={l.key}
              type="button"
              aria-pressed={l.key === layerKey}
              onClick={() => setLayerKey(l.key)}
              className={`rounded-full border px-3 py-1 ${
                l.key === layerKey
                  ? "border-emerald-600 bg-emerald-100 text-emerald-900 dark:bg-emerald-900 dark:text-emerald-50"
                  : "border-zinc-300 dark:border-zinc-600"
              }`}
            >
              {l.label}
            </button>
          ))}
        </div>

        <p className="text-zinc-600 dark:text-zinc-300">{layer.note}</p>

        <label className="flex flex-col gap-1">
          <span className="flex justify-between">
            <span>Date</span>
            <span className="font-medium">{prettyDate}</span>
          </span>
          <input
            type="range"
            min={0}
            max={DAYS_BACK - 2}
            value={step}
            onChange={(e) => setStep(Number(e.target.value))}
            aria-label="Imagery date"
          />
        </label>

        <p className="text-zinc-500 dark:text-zinc-400">
          Tap the map to mark your field.
        </p>
      </div>
    </div>
  );
}
