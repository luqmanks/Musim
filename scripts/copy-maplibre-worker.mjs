// MapLibre GL v6 finds its web worker via import.meta.url, which breaks once a bundler
// (Turbopack) rewrites the module URL ("Worker failed to load"). We serve the worker from
// /public instead and point MapLibre at it with setWorkerUrl(). Copying it on install keeps
// it in sync with the installed maplibre-gl version.
import { copyFileSync, mkdirSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";

const require = createRequire(import.meta.url);
const pkgDir = dirname(require.resolve("maplibre-gl/package.json"));
mkdirSync("public", { recursive: true });
copyFileSync(
  join(pkgDir, "dist", "maplibre-gl-worker.mjs"),
  join("public", "maplibre-gl-worker.mjs"),
);
console.log("Copied maplibre-gl-worker.mjs to public/");
