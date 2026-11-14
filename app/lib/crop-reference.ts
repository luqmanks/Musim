// Crop reference facts for the rotation engine.
//
// These are NOT NASA data and NOT scores. They are the agronomic requirements each crop
// has to meet (how much water it needs, what temperatures it tolerates, whether it fixes
// nitrogen). NASA POWER supplies the climate; the engine compares the two.
//
// Values are approximate, rounded ranges for a ~4 month crop cycle in the humid tropics.
// They have NOT been reviewed by a Malaysian agronomist. Review them (e.g. with MARDI or the
// Department of Agriculture) and replace with cited local figures before operational use.

export type CropReference = {
  id: string;
  label: string;
  yields: boolean; // produces a sellable harvest
  needMm: number; // water needed over one cycle (rain + irrigation), mm
  rainMaxMm: number | null; // rain above this over one cycle damages the crop on slow-draining soil; null = tolerant
  tempOpt: [number, number]; // °C mean temperature with no penalty
  tempAbs: [number, number]; // °C mean temperature at which the crop fails
  legume: boolean; // fixes nitrogen
  family: string; // botanical family group; repeating one back-to-back builds disease pressure
  erosionExposure: number; // 0 (dense or flooded cover) to 1 (bare soil)
  equipment: "paddy" | "upland" | "none"; // kind of machinery the crop needs
};

export const CROP_REFERENCE: CropReference[] = [
  { id: "paddy", label: "Paddy", yields: true, needMm: 1200, rainMaxMm: null, tempOpt: [24, 30], tempAbs: [15, 38], legume: false, family: "grass", erosionExposure: 0.2, equipment: "paddy" },
  { id: "mung-bean", label: "Mung bean", yields: true, needMm: 350, rainMaxMm: 800, tempOpt: [25, 32], tempAbs: [15, 40], legume: true, family: "legume", erosionExposure: 0.5, equipment: "upland" },
  { id: "maize", label: "Maize", yields: true, needMm: 600, rainMaxMm: 1100, tempOpt: [22, 30], tempAbs: [10, 40], legume: false, family: "grass", erosionExposure: 0.7, equipment: "upland" },
  { id: "groundnut", label: "Groundnut", yields: true, needMm: 500, rainMaxMm: 1000, tempOpt: [22, 30], tempAbs: [14, 38], legume: true, family: "legume", erosionExposure: 0.5, equipment: "upland" },
  { id: "cover-crop", label: "Cover crop", yields: false, needMm: 250, rainMaxMm: null, tempOpt: [22, 32], tempAbs: [12, 40], legume: true, family: "cover", erosionExposure: 0.1, equipment: "none" },
  { id: "fallow", label: "Fallow", yields: false, needMm: 0, rainMaxMm: null, tempOpt: [0, 99], tempAbs: [0, 99], legume: false, family: "none", erosionExposure: 1, equipment: "none" },
];

export const CROP_BY_ID = Object.fromEntries(CROP_REFERENCE.map((c) => [c.id, c])) as Record<string, CropReference>;
