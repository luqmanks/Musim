// NASA GIBS (Global Imagery Browse Services) layer config.
// Tile URL pattern (WMTS REST, Web Mercator, "best available"):
//   https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/{layer}/default/{YYYY-MM-DD}/{tileMatrixSet}/{z}/{y}/{x}.{ext}
// Always pass a date; tiles for "today" are mostly empty. To add a layer, check its
// exact id, tile matrix set and format in the GIBS GetCapabilities document.

export type GibsLayer = {
  key: string;
  label: string; // farmer-facing name
  note: string; // one-line plain-language explanation
  gibsId: string;
  tileMatrixSet: string;
  ext: "jpg" | "png";
  maxZoom: number; // native max zoom of the tile matrix set
};

export const GIBS_LAYERS: GibsLayer[] = [
  {
    key: "true-color",
    label: "Satellite photo",
    note: "What your land looks like from space (about 250 m per pixel).",
    gibsId: "MODIS_Terra_CorrectedReflectance_TrueColor",
    tileMatrixSet: "GoogleMapsCompatible_Level9",
    ext: "jpg",
    maxZoom: 9,
  },
  {
    key: "ground-heat",
    label: "Ground heat (day)",
    note: "Colours show how hot the ground surface gets. Gaps are usually clouds.",
    gibsId: "MODIS_Terra_Land_Surface_Temp_Day",
    tileMatrixSet: "GoogleMapsCompatible_Level7",
    ext: "png",
    maxZoom: 7,
  },
  {
    key: "soil-moisture",
    label: "Soil moisture",
    note: "Regional surface soil moisture from NASA SMAP (about 9 km per pixel).",
    gibsId: "SMAP_L3_Passive_Enhanced_Day_Soil_Moisture",
    tileMatrixSet: "GoogleMapsCompatible_Level6",
    ext: "png",
    maxZoom: 6,
  },
  // TODO: vegetation health (NDVI). MODIS_Terra_L3_NDVI_16Day exists on the
  // epsg3857 "best" endpoint, but confirm its tileMatrixSet in GetCapabilities first.
];

export function gibsTileUrl(layer: GibsLayer, isoDate: string): string {
  return `https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/${layer.gibsId}/default/${isoDate}/${layer.tileMatrixSet}/{z}/{y}/{x}.${layer.ext}`;
}

export function isoDaysBefore(base: Date, days: number): string {
  const d = new Date(base.getTime() - days * 86_400_000);
  return d.toISOString().slice(0, 10);
}
