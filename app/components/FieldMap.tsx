"use client";

import { useEffect, useRef, useState } from "react";
import type { Map as MLMap, Marker as MLMarker } from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { GIBS_LAYERS, gibsTileUrl, isoDaysBefore } from "../lib/gibs";
import {
  FIELD_HEAT,
  FIELD_HEAT_KEY,
  HEAT_RAMP,
  type DemoFarm,
  type EcostressScene,
} from "../lib/ecostress";

export type FieldLocation = { lng: number; lat: number };

const SRC = "overlay";
const LAYER = "overlay-layer";
const DAYS_BACK = 60; // GIBS date scrubber range
const DEFAULT_LAG = 3; // GIBS imagery usually lags a few days

const CHIPS = [
  ...GIBS_LAYERS.map((l) => ({ key: l.key, label: l.label })),
  { key: FIELD_HEAT.key, label: FIELD_HEAT.label },
];

export default function FieldMap({
  onLocationChange,
}: {
  onLocationChange?: (p: FieldLocation) => void;
}) {
  const container = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MLMap | null>(null);
  const markerRef = useRef<MLMarker | null>(null);
  const onLocationRef = useRef(onLocationChange);
  const placeMarkerRef = useRef<((lngLat: [number, number]) => void) | null>(null);
  const [ready, setReady] = useState(false);
  const [layerKey, setLayerKey] = useState(GIBS_LAYERS[0].key);
  // Read the clock after mount: Next "cacheComponents" forbids new Date() during prerender.
  const [today, setToday] = useState<Date | null>(null);
  const [step, setStep] = useState(DAYS_BACK - DEFAULT_LAG); // right = newest
  const [farms, setFarms] = useState<DemoFarm[]>([]);
  const [farmId, setFarmId] = useState<string | null>(null);
  const [scenes, setScenes] = useState<Record<string, EcostressScene | "error">>({});

  useEffect(() => {
    onLocationRef.current = onLocationChange;
  }, [onLocationChange]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setToday(new Date());
  }, []);

  const isScene = layerKey === FIELD_HEAT_KEY;
  const gibsLayer = GIBS_LAYERS.find((l) => l.key === layerKey);
  const date = today ? isoDaysBefore(today, DAYS_BACK - step) : null;
  const farm = farms.find((f) => f.id === farmId);
  const sceneEntry = farmId ? scenes[farmId] : undefined;
  const scene = sceneEntry && sceneEntry !== "error" ? sceneEntry : undefined;

  // Demo farm list (static JSON in /public/data/farms).
  useEffect(() => {
    let off = false;
    fetch("/data/farms/index.json")
      .then((r) => (r.ok ? r.json() : []))
      .then((d: DemoFarm[]) => !off && setFarms(d))
      .catch(() => {});
    return () => {
      off = true;
    };
  }, []);

  // Load the selected farm's ECOSTRESS scene once.
  useEffect(() => {
    if (!isScene || !farm || scenes[farm.id]) return;
    let off = false;
    fetch(farm.scene)
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
      .then((d: EcostressScene) => !off && setScenes((s) => ({ ...s, [farm.id]: d })))
      .catch(() => !off && setScenes((s) => ({ ...s, [farm.id]: "error" })));
    return () => {
      off = true;
    };
  }, [isScene, farm, scenes]);

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
      placeMarkerRef.current = (lngLat) => {
        if (!markerRef.current) {
          markerRef.current = new maplibregl.Marker().setLngLat(lngLat).addTo(m);
        } else {
          markerRef.current.setLngLat(lngLat);
        }
        onLocationRef.current?.({ lng: lngLat[0], lat: lngLat[1] });
      };
      m.on("click", (e) => placeMarkerRef.current?.([e.lngLat.lng, e.lngLat.lat]));
    })();

    return () => {
      cancelled = true;
      markerRef.current?.remove();
      markerRef.current = null;
      placeMarkerRef.current = null;
      map?.remove();
      mapRef.current = null;
    };
  }, []);

  // (Re)draw the overlay when the layer, date or farm scene changes (debounced for the scrubber).
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !ready) return;
    const t = setTimeout(() => {
      if (map.getLayer(LAYER)) map.removeLayer(LAYER);
      if (map.getSource(SRC)) map.removeSource(SRC);

      if (isScene) {
        if (!scene) return;
        const [w, s, e, n] = scene.bounds;
        map.addSource(SRC, {
          type: "image",
          url: scene.image,
          coordinates: [
            [w, n],
            [e, n],
            [e, s],
            [w, s],
          ],
        });
        map.addLayer({
          id: LAYER,
          type: "raster",
          source: SRC,
          // "nearest" keeps the real ~70 m pixels visible instead of blurring them.
          paint: { "raster-opacity": 0.85, "raster-resampling": "nearest" },
        });
        return;
      }

      if (!gibsLayer || !date) return;
      map.addSource(SRC, {
        type: "raster",
        tiles: [gibsTileUrl(gibsLayer, date)],
        tileSize: 256,
        maxzoom: gibsLayer.maxZoom,
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
  }, [isScene, scene, gibsLayer, date, ready]);

  function pickFarm(f: DemoFarm) {
    setFarmId(f.id);
    mapRef.current?.flyTo({ center: f.center, zoom: f.zoom });
    placeMarkerRef.current?.(f.center);
  }

  function pickLayer(key: string) {
    setLayerKey(key);
    if (key === FIELD_HEAT_KEY && !farmId && farms[0]) pickFarm(farms[0]);
  }

  const prettyDate = date
    ? new Date(date + "T00:00:00Z").toLocaleDateString(undefined, {
        day: "numeric",
        month: "short",
        year: "numeric",
        timeZone: "UTC",
      })
    : "…";

  const note = isScene ? FIELD_HEAT.note : gibsLayer?.note;

  return (
    <div className="relative h-full min-h-[420px] w-full">
      {/* Inline style on purpose: maplibre-gl.css sets .maplibregl-map { position: relative },
          which would override a Tailwind "absolute inset-0" class and collapse the map to 0px tall. */}
      <div ref={container} style={{ position: "absolute", inset: 0 }} />

      <div className="absolute left-3 top-3 flex max-h-[calc(100%-1.5rem)] w-72 max-w-[calc(100%-5rem)] flex-col gap-3 overflow-y-auto rounded-xl bg-white/95 p-3 text-sm text-zinc-900 shadow-lg dark:bg-zinc-900/95 dark:text-zinc-50">
        <div className="flex flex-wrap gap-2" role="group" aria-label="Map layer">
          {CHIPS.map((c) => (
            <button
              key={c.key}
              type="button"
              aria-pressed={c.key === layerKey}
              onClick={() => pickLayer(c.key)}
              className={`rounded-full border px-3 py-1 ${
                c.key === layerKey
                  ? "border-emerald-600 bg-emerald-100 text-emerald-900 dark:bg-emerald-900 dark:text-emerald-50"
                  : "border-zinc-300 dark:border-zinc-600"
              }`}
            >
              {c.label}
            </button>
          ))}
        </div>

        <p className="text-zinc-600 dark:text-zinc-300">{note}</p>

        {isScene ? (
          <div className="flex flex-col gap-3">
            <div className="flex flex-wrap gap-2" role="group" aria-label="Demo farm">
              {farms.map((f) => (
                <button
                  key={f.id}
                  type="button"
                  aria-pressed={f.id === farmId}
                  onClick={() => pickFarm(f)}
                  className={`rounded-full border px-3 py-1 ${
                    f.id === farmId
                      ? "border-sky-600 bg-sky-100 text-sky-900 dark:bg-sky-900 dark:text-sky-50"
                      : "border-zinc-300 dark:border-zinc-600"
                  }`}
                >
                  {f.name}
                </button>
              ))}
            </div>

            {sceneEntry === "error" && (
              <p role="alert">Couldn’t load heat data for this farm.</p>
            )}

            {scene && (
              <>
                {scene.isMock && (
                  <p className="rounded-md bg-amber-100 px-2 py-1 text-amber-900 dark:bg-amber-900 dark:text-amber-50">
                    Sample data for layout only. Not real satellite readings.
                  </p>
                )}
                <div>
                  <div
                    className="h-3 rounded"
                    style={{
                      background: `linear-gradient(to right, ${HEAT_RAMP.join(",")})`,
                    }}
                    aria-hidden="true"
                  />
                  <div className="mt-1 flex justify-between text-zinc-600 dark:text-zinc-300">
                    <span>Cooler {Math.round(scene.minC)} °C</span>
                    <span>Hotter {Math.round(scene.maxC)} °C</span>
                  </div>
                </div>
                <ul className="flex flex-col gap-1 text-zinc-700 dark:text-zinc-200">
                  <li>
                    Satellite pass:{" "}
                    {new Date(scene.acquired).toLocaleString(undefined, {
                      dateStyle: "medium",
                      timeStyle: "short",
                    })}
                  </li>
                  <li>
                    Clear sky over {Math.round(scene.clearFraction * 100)}% of
                    this area. Cloudy patches are left blank.
                  </li>
                  {scene.hottest && (
                    <li>Hottest spot: about {Math.round(scene.hottest.tempC)} °C</li>
                  )}
                </ul>
                <p className="text-zinc-500 dark:text-zinc-400">
                  Source: NASA ECOSTRESS ({scene.product}). The satellite passes
                  at different times each day, so this is one moment, not an
                  average.
                </p>
              </>
            )}
          </div>
        ) : (
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
        )}

        <p className="text-zinc-500 dark:text-zinc-400">
          Tap the map to see weather &amp; crop alerts for that spot.
        </p>
      </div>
    </div>
  );
}
