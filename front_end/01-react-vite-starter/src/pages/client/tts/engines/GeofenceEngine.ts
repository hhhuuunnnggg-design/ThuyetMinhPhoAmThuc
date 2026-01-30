import type { TTSAudio } from "@/api/tts.api";
import { GeoPosition, POI } from "../types";
import { haversineDistance } from "../utils/geo";

/**
 * Geofence Engine: Xác định POI gần nhất/ưu tiên cao nhất trong bán kính
 */
export class GeofenceEngine {
  /**
   * Chuyển đổi TTSAudio thành POI
   * Priority được tính ở frontend dựa trên:
   * - Nếu có priority từ backend → dùng luôn
   * - Nếu không → tính dựa trên createdAt (mới nhất = priority cao hơn)
   * - Hoặc có thể dùng ID (ID nhỏ hơn = priority cao hơn)
   */
  static audioToPOI(audio: TTSAudio & { priority?: number | null }): POI | null {
    if (audio.latitude == null || audio.longitude == null) return null;

    // Tính priority: nếu backend có thì dùng, không thì tính từ createdAt / id
    let priority = (audio as any).priority ?? (audio as any).priority;
    if (priority == null && (audio as any).triggerRadiusMeters != null) {
      // giữ chỗ, ưu tiên backend nếu có cấu hình riêng
      priority = (audio as any).priority;
    }
    if (priority == null) {
      // Tính priority từ createdAt (mới nhất = priority cao hơn)
      // Hoặc có thể dùng ID ngược lại (ID nhỏ = priority cao)
      // Ở đây dùng ID ngược: ID càng nhỏ = priority càng cao
      priority = 1000 - audio.id; // ID nhỏ → priority cao
    }

    return {
      id: audio.id,
      latitude: audio.latitude,
      longitude: audio.longitude,
      // Ưu tiên bán kính từ backend, fallback về accuracy
      radius: (audio as any).triggerRadiusMeters ?? audio.accuracy ?? 50,
      priority,
      audioId: audio.id,
    };
  }

  /**
   * Tìm POI gần nhất và có priority cao nhất trong bán kính
   * @param position Vị trí hiện tại của user
   * @param pois Danh sách POI
   * @returns POI được chọn hoặc null nếu không có POI nào trong bán kính
   */
  static findNearestPOI(position: GeoPosition, pois: POI[]): POI | null {
    let bestPOI: POI | null = null;
    let bestScore = -Infinity;

    for (const poi of pois) {
      const distance = haversineDistance(position, {
        lat: poi.latitude,
        lng: poi.longitude,
      });

      // Kiểm tra xem có trong bán kính không
      if (distance > poi.radius) continue;

      // Tính điểm số: priority cao hơn và gần hơn = điểm cao hơn
      // Ưu tiên priority trước, sau đó mới đến khoảng cách
      const score = poi.priority * 10000 - distance; // Priority quan trọng hơn distance

      if (score > bestScore) {
        bestScore = score;
        bestPOI = poi;
      }
    }

    return bestPOI;
  }

  /**
   * Lấy tất cả POI trong bán kính (không sắp xếp)
   */
  static getPOIsInRange(position: GeoPosition, pois: POI[]): POI[] {
    return pois.filter((poi) => {
      const distance = haversineDistance(position, {
        lat: poi.latitude,
        lng: poi.longitude,
      });
      return distance <= poi.radius;
    });
  }
}
