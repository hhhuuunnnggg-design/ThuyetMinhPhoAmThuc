import { NearbyPOI } from "../types";
import { haversineDistance } from "./geo";

export interface POIGeofence {
  poi: NearbyPOI;
  distance: number; // meters
  isInside: boolean;
  triggerRadiusMeters: number;
}

export class GeofenceEngine {
  /**
   * Kiểm tra xem vị trí hiện tại có đang trong bán kính kích hoạt của POI nào không.
   * Trả về POI gần nhất đang trong vùng, hoặc null.
   */
  checkGeofences(
    lat: number,
    lng: number,
    pois: NearbyPOI[]
  ): POIGeofence | null {
    let closestInside: POIGeofence | null = null;
    let closestDist = Infinity;

    for (const poi of pois) {
      if (poi.latitude == null || poi.longitude == null) continue;

      const distance = haversineDistance(
        lat,
        lng,
        poi.latitude,
        poi.longitude
      );
      const radius = poi.triggerRadiusMeters ?? 50;
      const isInside = distance <= radius;

      if (isInside && distance < closestDist) {
        closestDist = distance;
        closestInside = { poi, distance, isInside, triggerRadiusMeters: radius };
      }
    }

    return closestInside;
  }

  /**
   * Tìm tất cả POI đang trong vùng kích hoạt.
   */
  findAllInside(
    lat: number,
    lng: number,
    pois: NearbyPOI[]
  ): POIGeofence[] {
    const result: POIGeofence[] = [];

    for (const poi of pois) {
      if (poi.latitude == null || poi.longitude == null) continue;

      const distance = haversineDistance(
        lat,
        lng,
        poi.latitude,
        poi.longitude
      );
      const radius = poi.triggerRadiusMeters ?? 50;
      const isInside = distance <= radius;

      if (isInside) {
        result.push({ poi, distance, isInside, triggerRadiusMeters: radius });
      }
    }

    return result.sort((a, b) => a.distance - b.distance);
  }

  /**
   * Kiểm tra xem vị trí mới có khác vị trí cũ đủ để cập nhật không.
   * Dùng để tránh gọi quá nhiều khi GPS jitter.
   */
  hasMovedEnough(
    prevLat: number,
    prevLng: number,
    nextLat: number,
    nextLng: number,
    thresholdMeters = 5
  ): boolean {
    const dist = haversineDistance(prevLat, prevLng, nextLat, nextLng);
    return dist >= thresholdMeters;
  }
}

export const geofenceEngine = new GeofenceEngine();
