// ECOSTRESS field-heat layer (70 m land surface temperature, product ECO_L2T_LSTE).
//
// The browser does NOT read NASA's tiles directly (large COGs, Earthdata Login).
// A processing step produces, per farm, one colourised PNG + one small JSON file that
// follow the contract below. See docs/ecostress-data-contract.md.

export const FIELD_HEAT_KEY = "field-heat";

export const FIELD_HEAT = {
  key: FIELD_HEAT_KEY,
  label: "Field heat (70 m)",
  note: "How hot the ground itself gets, in patches about 70 m wide. It is not the same as air temperature.",
};

/** Colour ramp used by BOTH the PNG generator and the legend (cool -> hot). */
export const HEAT_RAMP = ["#3b4cc0", "#7aa0f8", "#f2d85a", "#f08a3c", "#c8201f"];

export type DemoFarm = {
  id: string;
  name: string;
  center: [number, number]; // [lng, lat]
  zoom: number;
  scene: string; // URL of the farm's ecostress.json
};

export type EcostressScene = {
  isMock?: boolean; // true for placeholder data (UI shows a "sample data" badge)
  product: string; // e.g. "ECO_L2T_LSTE v002"
  farmId: string;
  acquired: string; // ISO 8601 UTC time of the satellite pass
  bounds: [number, number, number, number]; // [west, south, east, north], WGS84
  image: string; // URL of an RGBA PNG; transparent where cloud, water or no data
  minC: number; // temperature mapped to the cold end of HEAT_RAMP
  maxC: number; // temperature mapped to the hot end of HEAT_RAMP
  clearFraction: number; // 0..1, share of the area with usable (clear-sky) pixels
  hottest?: { lng: number; lat: number; tempC: number };
};
