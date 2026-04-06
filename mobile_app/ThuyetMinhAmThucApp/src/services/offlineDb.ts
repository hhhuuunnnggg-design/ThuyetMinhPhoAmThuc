import * as SQLite from "expo-sqlite";
import { POI, AudioInfo } from "../types";

const DB_NAME = "offline_poi.db";

// Schema:
//   pois         — POI + restaurant metadata (latest version per POI)
//   pois_audios  — audio metadata per POI (language → AudioInfo)
//   pois_images  — base64 image per POI (small, for offline detail screen)
//   sync_meta    — key=value metadata (last_sync_at, schema_version)

export interface OfflinePOI {
  id: number;
  groupId: number;
  groupKey: string;
  foodName: string | null;
  price: number | null;
  description: string | null;
  imageUrl: string | null;
  latitude: number | null;
  longitude: number | null;
  accuracy: number | null;
  triggerRadiusMeters: number | null;
  priority: number | null;
  originalText: string | null;
  originalVoice: string | null;
  address: string | null;
  category: string | null;
  openHours: string | null;
  phone: string | null;
  isActive: boolean;
  viewCount: number;
  likeCount: number;
  qrCode: string | null;
  version: number;
  restaurantName: string | null;
  restaurantVerified: boolean;
  createdAt: string;
  updatedAt: string | null;
  distanceMeters: number | null;
  activeListenerCount: number;
  downloadedOffline: boolean;
  /** Rỗng khi load từ list SQLite; POIDetailScreen bổ sung qua getAllAudiosForPOI / API */
  audios?: Record<string, AudioInfo>;
}

/** ID POI hợp lệ cho SQLite (tránh poi_id NULL → lỗi 19 NOT NULL). */
export function normalizePoiId(id: unknown): number | null {
  if (id == null || id === "") return null;
  const n = typeof id === "number" ? id : Number(id);
  if (!Number.isFinite(n) || n < 1) return null;
  return Math.trunc(n);
}

class OfflineDbService {
  private db: SQLite.SQLiteDatabase | null = null;

  async open(): Promise<SQLite.SQLiteDatabase> {
    if (this.db) return this.db;
    this.db = await SQLite.openDatabaseAsync(DB_NAME);
    await this.initSchema();
    return this.db;
  }

  private async initSchema(): Promise<void> {
    const db = this.db!;
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS pois (
        id              INTEGER PRIMARY KEY,
        groupId         INTEGER,
        groupKey        TEXT,
        foodName        TEXT,
        price           REAL,
        description     TEXT,
        imageUrl        TEXT,
        latitude        REAL,
        longitude       REAL,
        accuracy        REAL,
        triggerRadiusMeters REAL,
        priority        INTEGER,
        originalText    TEXT,
        originalVoice   TEXT,
        address         TEXT,
        category        TEXT,
        openHours       TEXT,
        phone           TEXT,
        isActive        INTEGER DEFAULT 1,
        viewCount       INTEGER DEFAULT 0,
        likeCount       INTEGER DEFAULT 0,
        qrCode          TEXT,
        version         INTEGER DEFAULT 0,
        restaurantName  TEXT,
        restaurantVerified INTEGER DEFAULT 0,
        createdAt       TEXT,
        updatedAt       TEXT,
        distanceMeters  REAL,
        activeListenerCount INTEGER DEFAULT 0,
        downloadedOffline INTEGER DEFAULT 1,
        UNIQUE(id)
      );

      CREATE TABLE IF NOT EXISTS pois_audios (
        poi_id      INTEGER NOT NULL,
        lang        TEXT    NOT NULL,
        audioId     INTEGER,
        languageName TEXT,
        voice       TEXT,
        speed       REAL,
        format      INTEGER,
        withoutFilter INTEGER,
        s3Url       TEXT,
        fileSize    INTEGER,
        mimeType    TEXT,
        durationSeconds REAL,
        localPath   TEXT,
        PRIMARY KEY (poi_id, lang),
        FOREIGN KEY (poi_id) REFERENCES pois(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS sync_meta (
        key   TEXT PRIMARY KEY,
        value TEXT
      );
    `);
  }

  // ============ POI CRUD ============

  /** Upsert một POI (INSERT OR REPLACE — dùng version để tránh ghi đè cũ hơn). */
  async upsertPOI(poi: OfflinePOI): Promise<void> {
    const pid = normalizePoiId(poi.id);
    if (pid == null) return;

    const db = await this.open();
    await db.runAsync(
      `INSERT INTO pois (
        id, groupId, groupKey, foodName, price, description, imageUrl,
        latitude, longitude, accuracy, triggerRadiusMeters, priority,
        originalText, originalVoice, address, category, openHours, phone,
        isActive, viewCount, likeCount, qrCode, version,
        restaurantName, restaurantVerified, createdAt, updatedAt,
        distanceMeters, activeListenerCount, downloadedOffline
      ) VALUES (
        $id, $groupId, $groupKey, $foodName, $price, $description, $imageUrl,
        $latitude, $longitude, $accuracy, $triggerRadiusMeters, $priority,
        $originalText, $originalVoice, $address, $category, $openHours, $phone,
        $isActive, $viewCount, $likeCount, $qrCode, $version,
        $restaurantName, $restaurantVerified, $createdAt, $updatedAt,
        $distanceMeters, $activeListenerCount, 1
      )
      ON CONFLICT(id) DO UPDATE SET
        version = CASE WHEN excluded.version > pois.version THEN excluded.version ELSE pois.version END,
        foodName = excluded.foodName,
        description = excluded.description,
        latitude = excluded.latitude,
        longitude = excluded.longitude,
        address = excluded.address,
        openHours = excluded.openHours,
        phone = excluded.phone,
        isActive = excluded.isActive,
        updatedAt = excluded.updatedAt
      WHERE excluded.version > pois.version
         OR excluded.isActive != pois.isActive`,
      {
        $id: pid,
        $groupId: poi.groupId,
        $groupKey: poi.groupKey,
        $foodName: poi.foodName ?? null,
        $price: poi.price ?? null,
        $description: poi.description ?? null,
        $imageUrl: poi.imageUrl ?? null,
        $latitude: poi.latitude ?? null,
        $longitude: poi.longitude ?? null,
        $accuracy: poi.accuracy ?? null,
        $triggerRadiusMeters: poi.triggerRadiusMeters ?? null,
        $priority: poi.priority ?? null,
        $originalText: poi.originalText ?? null,
        $originalVoice: poi.originalVoice ?? null,
        $address: poi.address ?? null,
        $category: poi.category ?? null,
        $openHours: poi.openHours ?? null,
        $phone: poi.phone ?? null,
        $isActive: poi.isActive ? 1 : 0,
        $viewCount: poi.viewCount ?? 0,
        $likeCount: poi.likeCount ?? 0,
        $qrCode: poi.qrCode ?? null,
        $version: poi.version ?? 0,
        $restaurantName: poi.restaurantName ?? null,
        $restaurantVerified: poi.restaurantVerified ? 1 : 0,
        $createdAt: poi.createdAt ?? null,
        $updatedAt: poi.updatedAt ?? null,
        $distanceMeters: poi.distanceMeters ?? null,
        $activeListenerCount: poi.activeListenerCount ?? 0,
      }
    );
  }

  /** Upsert audio metadata cho một POI. */
  async upsertPOIAudio(poiId: number, lang: string, audio: AudioInfo): Promise<void> {
    const pid = normalizePoiId(poiId);
    if (pid == null) return;
    const langKey = String(lang ?? "").trim();
    if (!langKey) return;

    const db = await this.open();
    await db.runAsync(
      `INSERT INTO pois_audios (
        poi_id, lang, audioId, languageName, voice, speed, format,
        withoutFilter, s3Url, fileSize, mimeType, durationSeconds, localPath
      ) VALUES (
        $poi_id, $lang, $audioId, $languageName, $voice, $speed, $format,
        $withoutFilter, $s3Url, $fileSize, $mimeType, $durationSeconds, $localPath
      )
      ON CONFLICT(poi_id, lang) DO UPDATE SET
        audioId = excluded.audioId,
        languageName = excluded.languageName,
        voice = excluded.voice,
        speed = excluded.speed,
        format = excluded.format,
        withoutFilter = excluded.withoutFilter,
        s3Url = excluded.s3Url,
        fileSize = excluded.fileSize,
        mimeType = excluded.mimeType,
        durationSeconds = excluded.durationSeconds,
        localPath = COALESCE(excluded.localPath, pois_audios.localPath)`,
      {
        $poi_id: pid,
        $lang: langKey,
        $audioId: audio.audioId ?? null,
        $languageName: audio.languageName ?? null,
        $voice: audio.voice ?? null,
        $speed: audio.speed ?? null,
        $format: audio.format ?? null,
        $withoutFilter: audio.withoutFilter ? 1 : 0,
        $s3Url: audio.s3Url ?? null,
        $fileSize: audio.fileSize ?? null,
        $mimeType: audio.mimeType ?? null,
        $durationSeconds: audio.durationSeconds ?? null,
        $localPath: audio.localPath ?? null,
      }
    );
  }

  /** Lấy tất cả POI đã cache (offline). */
  async getAllPOIs(): Promise<OfflinePOI[]> {
    const db = await this.open();
    const rows = await db.getAllAsync<any>(
      `SELECT p.*, pa.localPath as audio_localPath
       FROM pois p
       LEFT JOIN pois_audios pa ON p.id = pa.poi_id AND pa.lang = 'vi'
       WHERE p.isActive = 1
       ORDER BY p.priority DESC, p.viewCount DESC`
    );
    return rows.map(mapRowToPOI);
  }

  /** Lấy một POI theo ID từ cache. */
  async getPOIById(id: number): Promise<OfflinePOI | null> {
    const db = await this.open();
    const row = await db.getFirstAsync<any>(
      `SELECT * FROM pois WHERE id = ? AND isActive = 1`,
      [id]
    );
    return row ? mapRowToPOI(row) : null;
  }

  /** Tất cả bản ghi audio của POI (map lang → AudioInfo), dùng khi không gọi được API. */
  async getAllAudiosForPOI(poiId: number): Promise<Record<string, AudioInfo>> {
    const db = await this.open();
    const rows = await db.getAllAsync<any>(
      `SELECT * FROM pois_audios WHERE poi_id = ?`,
      [poiId]
    );
    const out: Record<string, AudioInfo> = {};
    for (const row of rows) {
      const lang = row.lang as string;
      out[lang] = {
        audioId: row.audioId,
        languageCode: lang,
        languageName: row.languageName,
        voice: row.voice,
        speed: row.speed,
        format: row.format,
        withoutFilter: row.withoutFilter ? true : false,
        s3Url: row.s3Url,
        fileSize: row.fileSize,
        mimeType: row.mimeType,
        durationSeconds: row.durationSeconds,
        localPath: row.localPath ?? undefined,
      };
    }
    return out;
  }

  /** Lấy audio info của một POI theo ngôn ngữ. */
  async getAudioForPOI(poiId: number, lang: string): Promise<AudioInfo | null> {
    const db = await this.open();
    const row = await db.getFirstAsync<any>(
      `SELECT * FROM pois_audios WHERE poi_id = ? AND lang = ?`,
      [poiId, lang]
    );
    if (!row) return null;
    return {
      audioId: row.audioId,
      languageCode: row.lang,
      languageName: row.languageName,
      voice: row.voice,
      speed: row.speed,
      format: row.format,
      withoutFilter: row.withoutFilter ? true : false,
      s3Url: row.s3Url,
      fileSize: row.fileSize,
      mimeType: row.mimeType,
      durationSeconds: row.durationSeconds,
      localPath: row.localPath ?? undefined,
    };
  }

  /** Xóa POI khỏi cache (khi bị xóa ở server hoặc user muốn clear). */
  async deletePOI(id: number): Promise<void> {
    const db = await this.open();
    await db.runAsync(`DELETE FROM pois_audios WHERE poi_id = ?`, [id]);
    await db.runAsync(`DELETE FROM pois WHERE id = ?`, [id]);
  }

  /** Cập nhật đường dẫn local của audio (sau khi tải .mp3 về). */
  async updateLocalAudioPath(poiId: number, lang: string, localPath: string): Promise<void> {
    const pid = normalizePoiId(poiId);
    if (pid == null) return;
    const db = await this.open();
    await db.runAsync(
      `UPDATE pois_audios SET localPath = ? WHERE poi_id = ? AND lang = ?`,
      [localPath, pid, lang]
    );
  }

  // ============ Sync metadata ============

  async setSyncTime(isoString: string): Promise<void> {
    const db = await this.open();
    await db.runAsync(
      `INSERT INTO sync_meta (key, value) VALUES ('last_sync_at', ?)
       ON CONFLICT(key) DO UPDATE SET value = excluded.value`,
      [isoString]
    );
  }

  async getLastSyncTime(): Promise<string | null> {
    const db = await this.open();
    const row = await db.getFirstAsync<{ value: string }>(
      `SELECT value FROM sync_meta WHERE key = 'last_sync_at'`
    );
    return row?.value ?? null;
  }

  /** Xóa toàn bộ data (clear cache). */
  async clearAll(): Promise<void> {
    const db = await this.open();
    await db.execAsync(`
      DELETE FROM pois_audios;
      DELETE FROM pois;
      DELETE FROM sync_meta;
    `);
  }

  /** Đếm tổng POI trong cache. */
  async getPoiCount(): Promise<number> {
    const db = await this.open();
    const row = await db.getFirstAsync<{ cnt: number }>(
      `SELECT COUNT(*) as cnt FROM pois WHERE isActive = 1`
    );
    return row?.cnt ?? 0;
  }
}

function mapRowToPOI(row: any): OfflinePOI {
  return {
    id: row.id,
    groupId: row.groupId ?? 0,
    groupKey: row.groupKey ?? "",
    foodName: row.foodName ?? null,
    price: row.price ?? null,
    description: row.description ?? null,
    imageUrl: row.imageUrl ?? null,
    latitude: row.latitude ?? null,
    longitude: row.longitude ?? null,
    accuracy: row.accuracy ?? null,
    triggerRadiusMeters: row.triggerRadiusMeters ?? null,
    priority: row.priority ?? null,
    originalText: row.originalText ?? null,
    originalVoice: row.originalVoice ?? null,
    address: row.address ?? null,
    category: row.category ?? null,
    openHours: row.openHours ?? null,
    phone: row.phone ?? null,
    isActive: row.isActive === 1,
    viewCount: row.viewCount ?? 0,
    likeCount: row.likeCount ?? 0,
    qrCode: row.qrCode ?? null,
    version: row.version ?? 0,
    restaurantName: row.restaurantName ?? null,
    restaurantVerified: row.restaurantVerified === 1,
    /** Danh sách POI offline không join đủ lang — POIDetailScreen sẽ gọi getAllAudiosForPOI */
    audios: {},
    createdAt: row.createdAt ?? "",
    updatedAt: row.updatedAt ?? null,
    distanceMeters: row.distanceMeters ?? null,
    activeListenerCount: row.activeListenerCount ?? 0,
    downloadedOffline: row.downloadedOffline === 1,
  };
}

export const offlineDbService = new OfflineDbService();
