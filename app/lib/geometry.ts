import type { FieldLocation } from "./field-shift";

export type FieldCoordinate = [lng: number, lat: number];

export function fieldAreaHectares(points: FieldCoordinate[]): number {
  if (points.length < 3) return 0;
  const meanLat = points.reduce((sum, point) => sum + point[1], 0) / points.length;
  const longitudeMetres = 111_320 * Math.cos((meanLat * Math.PI) / 180);
  const latitudeMetres = 110_540;
  let twiceArea = 0;

  for (let index = 0; index < points.length; index += 1) {
    const current = points[index];
    const next = points[(index + 1) % points.length];
    twiceArea +=
      current[0] * longitudeMetres * next[1] * latitudeMetres -
      next[0] * longitudeMetres * current[1] * latitudeMetres;
  }

  return Math.abs(twiceArea) / 2 / 10_000;
}

export function fieldCentroid(points: FieldCoordinate[]): FieldCoordinate {
  if (points.length === 0) return [101.2, 4.4];
  return [
    points.reduce((sum, point) => sum + point[0], 0) / points.length,
    points.reduce((sum, point) => sum + point[1], 0) / points.length,
  ];
}

export function locationFromBoundary(points: FieldCoordinate[]): FieldLocation {
  const [lng, lat] = fieldCentroid(points);
  return {
    name: "My field area",
    lat: Number(lat.toFixed(6)),
    lng: Number(lng.toFixed(6)),
    boundary: points,
    areaHectares: Number(fieldAreaHectares(points).toFixed(2)),
  };
}
