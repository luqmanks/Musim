import type { FieldLocation, PriorityKey, ScenarioKey } from "../../lib/field-shift";
import type { MapLayerKey } from "../FieldMap";

export type Step = "locate" | "details" | "priorities" | "results";
export type ResultTab = "conditions" | "rotations" | "crops";

export const DEMO_FARMS: FieldLocation[] = [
  { name: "Kedah paddy demo", lat: 6.1, lng: 100.4, farmId: "demo-b" },
  { name: "Selangor paddy demo", lat: 3.43, lng: 101.18, farmId: "demo-a" },
];

export const DISTRICTS: FieldLocation[] = [
  ...DEMO_FARMS,
  { name: "Kota Bharu, Kelantan", lat: 6.1254, lng: 102.2381 },
  { name: "Seberang Perai, Penang", lat: 5.363, lng: 100.4667 },
  { name: "Kota Belud, Sabah", lat: 6.351, lng: 116.43 },
];

export const PRIORITIES: Array<{
  key: PriorityKey;
  label: string;
  description: string;
}> = [
  { key: "water", label: "Save water", description: "Prefer crops that cope with less irrigation." },
  { key: "soil", label: "Build soil health", description: "Reward diversity, roots and living cover." },
  { key: "income", label: "Protect income", description: "Keep locally marketable crops in the plan." },
  { key: "erosion", label: "Reduce erosion", description: "Limit bare ground during heavy rain." },
  { key: "nitrogen", label: "Use less nitrogen", description: "Reward nitrogen-fixing legumes." },
  { key: "practicality", label: "Keep it practical", description: "Limit new equipment and major changes." },
];

export const SCENARIOS: Array<{ key: ScenarioKey; label: string; note: string }> = [
  { key: "typical", label: "Typical", note: "Five-year NASA climate profile" },
  { key: "dry", label: "Drier", note: "Sensitivity test: lower water availability" },
  { key: "wet", label: "Wetter", note: "Sensitivity test: heavier rain pressure" },
  { key: "hotter", label: "+1 °C", note: "Sensitivity test: hotter conditions" },
];

export const MAP_LAYERS: Array<{ key: MapLayerKey; label: string; note: string }> = [
  { key: "base", label: "Map", note: "OpenStreetMap field context" },
  { key: "ground-heat", label: "Surface heat", note: "NASA MODIS daytime land-surface temperature" },
  { key: "soil-moisture", label: "Soil moisture", note: "NASA SMAP regional surface soil moisture" },
  { key: "true-color", label: "Satellite", note: "NASA MODIS true-colour imagery" },
];
