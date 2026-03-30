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
   * Luật ưu tiên (3 cấp):
   *   1. Có trong trigger radius  →  mới được xét
   *   2. Khoảng cách nhỏ nhất   →  ưu tiên trước  (yếu tố CHÍNH)
   *   3. Priority cao hơn       →  tie-breaker khi khoảng cách bằng nhau
   *   4. id nhỏ hơn            →  tie-breaker cuối cùng
   *
   * Trả về POI gần nhất đang trong vùng, hoặc null.
   */
  checkGeofences(
    lat: number,
    lng: number,
    pois: NearbyPOI[]
  ): POIGeofence | null {
    const scored: Array<POIGeofence & { sortDist: number; sortPriority: number; sortId: number }> = [];

    for (const poi of pois) {
      if (poi.latitude == null || poi.longitude == null) continue;

      const distance = haversineDistance(lat, lng, poi.latitude, poi.longitude);
      const radius = poi.triggerRadiusMeters ?? 50;
      const isInside = distance <= radius;

      if (isInside) {
        scored.push({
          poi,
          distance,
          isInside,
          triggerRadiusMeters: radius,
          sortDist: distance,
          sortPriority: poi.priority ?? 0,
          sortId: poi.id,
        });
      }
    }

    if (scored.length === 0) return null;

    // 1. Khoảng cách tăng dần  2. Priority giảm dần  3. id tăng dần
    scored.sort((a, b) => {
      if (a.sortDist !== b.sortDist) return a.sortDist - b.sortDist;
      if (a.sortPriority !== b.sortPriority) return b.sortPriority - a.sortPriority;
      return a.sortId - b.sortId;
    });

    const best = scored[0];
    return { poi: best.poi, distance: best.distance, isInside: best.isInside, triggerRadiusMeters: best.triggerRadiusMeters };
  }

  /**
   * Tìm tất cả POI đang trong vùng kích hoạt.
   * Sắp xếp: khoảng cách → priority → id.
   */
  findAllInside(
    lat: number,
    lng: number,
    pois: NearbyPOI[]
  ): POIGeofence[] {
    const result: Array<POIGeofence & { sortDist: number; sortPriority: number; sortId: number }> = [];

    for (const poi of pois) {
      if (poi.latitude == null || poi.longitude == null) continue;

      const distance = haversineDistance(lat, lng, poi.latitude, poi.longitude);
      const radius = poi.triggerRadiusMeters ?? 50;
      const isInside = distance <= radius;

      if (isInside) {
        result.push({
          poi,
          distance,
          isInside,
          triggerRadiusMeters: radius,
          sortDist: distance,
          sortPriority: poi.priority ?? 0,
          sortId: poi.id,
        });
      }
    }

    result.sort((a, b) => {
      if (a.sortDist !== b.sortDist) return a.sortDist - b.sortDist;
      if (a.sortPriority !== b.sortPriority) return b.sortPriority - a.sortPriority;
      return a.sortId - b.sortId;
    });

    return result.map(({ poi, distance, isInside, triggerRadiusMeters }) => ({
      poi, distance, isInside, triggerRadiusMeters,
    }));
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
