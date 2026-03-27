/**
 * offlineSync.ts
 *
 * Đồng bộ SQLite (local) ←→ Backend (server).
 *
 * Khi online + offline mode enabled:
 *   1. Gọi GET /api/v1/app/pois (full list hoặc delta sau lần đầu)
 *   2. Ghi vào SQLite
 *   3. Tải audio metadata (s3Url, duration…) về SQLite
 *   4. Tải file .mp3 về máy (nếu cần)
 *
 * Khi offline:
 *   → Chỉ đọc từ SQLite. Không gọi API.
 */

import * as FileSystem from "expo-file-system/legacy";
import api from "./api";
import { offlineDbService, OfflinePOI, normalizePoiId } from "./offlineDb";
import { POI, NearbyPOI } from "../types";
import { unwrapListResponse } from "../utils/apiResponse";
import { resolveMediaUrl } from "../utils/mediaUrl";

/**
 * Tải 1 file .mp3 từ URL về local.
 * Backend lưu file trong project → `s3Url` thường là `/uploads/...` (tương đối).
 * `downloadAsync` bắt buộc URL tuyệt đối → ghép `getApiBaseUrl()` giống ảnh (resolveMediaUrl).
 */
async function downloadAudioFile(
  poiId: number,
  lang: string,
  s3Url: string
): Promise<string> {
  const absolute = resolveMediaUrl(s3Url);
  if (!absolute) {
    throw new Error(`URL audio rỗng hoặc không hợp lệ: ${s3Url}`);
  }

  const dir = `${FileSystem.documentDirectory ?? ""}offline/audio/`;
  await FileSystem.makeDirectoryAsync(dir, { intermediates: true });
  const filePath = `${dir}${poiId}_${lang}.mp3`;

  const { uri } = await FileSystem.downloadAsync(absolute, filePath, {
    cache: false,
  });
  return uri;
}

/**
 * Convert POI/NearbyPOI (from API) → OfflinePOI (SQLite schema).
 */
function toOfflinePOI(poi: POI | NearbyPOI): OfflinePOI {
  return {
    id: poi.id,
    groupId: poi.groupId,
    groupKey: poi.groupKey,
    foodName: poi.foodName,
    price: poi.price,
    description: poi.description,
    imageUrl: poi.imageUrl,
    latitude: poi.latitude,
    longitude: poi.longitude,
    accuracy: poi.accuracy,
    triggerRadiusMeters: poi.triggerRadiusMeters,
    priority: poi.priority,
    originalText: poi.originalText,
    originalVoice: poi.originalVoice,
    address: poi.address,
    category: poi.category,
    openHours: poi.openHours,
    phone: poi.phone,
    // API có thể thiếu field → undefined bị lưu 0 → getPoiCount (WHERE isActive=1) = 0
    isActive: poi.isActive !== false,
    viewCount: poi.viewCount,
    likeCount: poi.likeCount,
    qrCode: poi.qrCode,
    version: poi.version,
    restaurantName: poi.restaurantName,
    restaurantVerified: poi.restaurantVerified,
    createdAt: poi.createdAt,
    updatedAt: poi.updatedAt,
    // NearbyPOI-only fields (nullable if not present)
    distanceMeters: (poi as NearbyPOI).distanceMeters ?? null,
    activeListenerCount: (poi as NearbyPOI).activeListenerCount ?? 0,
    downloadedOffline: true,
  };
}

export interface SyncResult {
  poiCount: number;
  audioCount: number;
  error?: string;
}

class OfflineSyncService {
  private syncing = false;

  /**
   * Full sync: lấy toàn bộ POI + audio metadata từ backend → SQLite.
   * Gọi khi: bật offline lần đầu, hoặc pull-to-refresh.
   */
  async fullSync(preferredLang: string): Promise<SyncResult> {
    if (this.syncing) {
      return { poiCount: 0, audioCount: 0, error: "Sync đang chạy" };
    }
    this.syncing = true;

    try {
      // 0. Xóa cache cũ trước khi sync (tránh dữ liệu thừa từ lần trước)
      await offlineDbService.clearAll();
      // Xóa file audio đã tải về máy
      const audioDir = `${FileSystem.documentDirectory ?? ""}offline/audio/`;
      try {
        const dirInfo = await FileSystem.getInfoAsync(audioDir);
        if (dirInfo.exists) {
          await FileSystem.deleteAsync(audioDir, { idempotent: true });
        }
      } catch {}
      await FileSystem.makeDirectoryAsync(audioDir, { intermediates: true }).catch(() => {});

      // 1. Fetch POIs
      const res = await api.get("/api/v1/app/pois");
      const pois = unwrapListResponse<POI>(res.data);

      // 2. Upsert POIs
      for (const poi of pois) {
        const poiId = normalizePoiId(poi.id);
        if (poiId == null) continue;
        await offlineDbService.upsertPOI(toOfflinePOI({ ...(poi as POI), id: poiId }));
      }

      // 3. Fetch audio metadata + download audio files
      let audioCount = 0;
      for (const poi of pois) {
        const poiId = normalizePoiId(poi.id);
        if (poiId == null) continue;

        const audios = poi.audios;
        if (!audios || typeof audios !== "object") continue;

        const entries = Array.isArray(audios)
          ? (audios as unknown[]).map((a: any) => {
              if (!a || typeof a !== "object") return null;
              const lc = a.languageCode ?? a.language_code;
              if (!lc) return null;
              return [String(lc), a] as [string, typeof a];
            }).filter(Boolean) as [string, any][]
          : Object.entries(audios as Record<string, unknown>);

        for (const [lang, audio] of entries) {
          if (!audio || typeof audio !== "object") continue;
          const audioInfo = audio as any;
          const playbackUrl: string | undefined =
            audioInfo.s3Url ?? audioInfo.s3_url ?? undefined;

          // Lưu audio metadata
          await offlineDbService.upsertPOIAudio(poiId, lang, {
            ...audioInfo,
            s3Url: playbackUrl ?? audioInfo.s3Url ?? null,
          });

          // Tải file nếu có URL (backend có thể trả /uploads/... hoặc /api/v1/tts/groups/.../audio/...)
          if (playbackUrl) {
            try {
              const localPath = await downloadAudioFile(poiId, lang, playbackUrl);
              await offlineDbService.updateLocalAudioPath(poiId, lang, localPath);
              audioCount++;
            } catch (e) {
              console.warn(
                `[offlineSync] Không tải được MP3 poi=${poiId} lang=${lang} url=${playbackUrl}`,
                e
              );
            }
          }
        }
      }

      // 4. Ghi thời điểm sync
      await offlineDbService.setSyncTime(new Date().toISOString());

      return { poiCount: pois.length, audioCount };
    } catch (err: any) {
      return { poiCount: 0, audioCount: 0, error: err?.message ?? "Sync thất bại" };
    } finally {
      this.syncing = false;
    }
  }

  /**
   * Delta sync: chỉ fetch POI có version mới hơn lastSyncTime.
   * Gọi khi app mở (nếu offline mode đang bật).
   */
  async deltaSync(preferredLang: string): Promise<SyncResult> {
    if (this.syncing) return { poiCount: 0, audioCount: 0 };

    const lastSync = await offlineDbService.getLastSyncTime();
    if (!lastSync) {
      // Chưa sync lần nào → full sync
      return this.fullSync(preferredLang);
    }

    this.syncing = true;
    try {
      // Lấy toàn bộ, filter version ở client (server chưa hỗ trợ delta query)
      const res = await api.get("/api/v1/app/pois");
      const pois = unwrapListResponse<POI>(res.data);
      const lastTime = new Date(lastSync).getTime();

      const newPOIs = pois.filter(
        (p) => p.updatedAt && new Date(p.updatedAt).getTime() > lastTime
      );

      for (const poi of newPOIs) {
        const poiId = normalizePoiId(poi.id);
        if (poiId == null) continue;
        await offlineDbService.upsertPOI(toOfflinePOI({ ...(poi as POI), id: poiId }));
      }

      let audioCount = 0;
      for (const poi of newPOIs) {
        const poiId = normalizePoiId(poi.id);
        if (poiId == null) continue;

        const audios = poi.audios;
        if (!audios || typeof audios !== "object") continue;

        const entries = Array.isArray(audios)
          ? (audios as unknown[]).map((a: any) => {
              if (!a || typeof a !== "object") return null;
              const lc = a.languageCode ?? a.language_code;
              if (!lc) return null;
              return [String(lc), a] as [string, typeof a];
            }).filter(Boolean) as [string, any][]
          : Object.entries(audios as Record<string, unknown>);

        for (const [lang, audio] of entries) {
          if (!audio || typeof audio !== "object") continue;
          const audioInfo = audio as any;
          const playbackUrl: string | undefined =
            audioInfo.s3Url ?? audioInfo.s3_url ?? undefined;
          await offlineDbService.upsertPOIAudio(poiId, lang, {
            ...audioInfo,
            s3Url: playbackUrl ?? audioInfo.s3Url ?? null,
          });
          if (playbackUrl) {
            try {
              const localPath = await downloadAudioFile(poiId, lang, playbackUrl);
              await offlineDbService.updateLocalAudioPath(poiId, lang, localPath);
              audioCount++;
            } catch (e) {
              console.warn(
                `[offlineSync] Không tải được MP3 poi=${poiId} lang=${lang} url=${playbackUrl}`,
                e
              );
            }
          }
        }
      }

      await offlineDbService.setSyncTime(new Date().toISOString());
      return { poiCount: newPOIs.length, audioCount };
    } catch (err: any) {
      return { poiCount: 0, audioCount: 0, error: err?.message };
    } finally {
      this.syncing = false;
    }
  }

  isSyncing(): boolean {
    return this.syncing;
  }
}

export const offlineSyncService = new OfflineSyncService();
