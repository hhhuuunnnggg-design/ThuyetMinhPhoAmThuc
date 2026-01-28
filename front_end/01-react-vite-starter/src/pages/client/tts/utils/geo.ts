import { GeoPosition } from "../types";

export const haversineDistance = (p1: GeoPosition, p2: GeoPosition) => {
  const R = 6371000; // metres
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(p2.lat - p1.lat);
  const dLon = toRad(p2.lng - p1.lng);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(p1.lat)) * Math.cos(toRad(p2.lat)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};
