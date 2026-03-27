export interface DeviceConfig {
  id: number;
  deviceId: string;
  runningMode: "OFFLINE" | "STREAMING";
  offlineModeEnabled: boolean;
  lastSyncAt: string | null;
  downloadedVersions: string | null;
  totalDownloadedMB: number;
  lastSeenAt: string | null;
  poisNeedingSync?: Record<string, number>;
}

export interface POI {
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
  audios: Record<string, AudioInfo>;
  createdAt: string;
  updatedAt: string | null;
}

export interface AudioInfo {
  audioId: number;
  languageCode: string;
  languageName: string;
  voice: string | null;
  speed: number | null;
  format: number | null;
  withoutFilter: boolean | null;
  s3Url: string | null;
  fileSize: number | null;
  mimeType: string | null;
  durationSeconds: number | null;
  localPath?: string; // For offline mode
}

export interface NearbyPOI extends POI {
  /** Khoảng cách từ vị trí người dùng (m); null/undefined nếu chưa tính được */
  distanceMeters?: number | null;
  activeListenerCount: number;
  downloadedOffline: boolean;
}

export interface ActiveNarration {
  id: number;
  deviceId: string;
  poiId: number;
  poiName: string;
  audioId: number;
  languageCode: string;
  startedAt: string;
  estimatedEndAt: string;
  status: "PLAYING" | "COMPLETED" | "SKIPPED" | "EXPIRED";
  latitude: number | null;
  longitude: number | null;
}

export interface Payment {
  id: number;
  userId: string;
  poiId: number;
  poiName: string;
  restaurantId: number | null;
  restaurantName: string | null;
  amount: number;
  currency: string;
  status: "PENDING" | "SUCCESS" | "FAILED" | "REFUNDED" | "CANCELLED";
  payosTransactionId: string | null;
  payosPaymentLink: string | null;
  payosQrCode: string | null;
  paidAt: string | null;
  createdAt: string;
  description: string | null;
}

export interface GeoPosition {
  latitude: number;
  longitude: number;
  accuracy?: number;
}

export interface DeviceInfo {
  deviceId: string;
  osVersion: string;
  appVersion: string;
  ramMB: number;
  storageFreeMB: number;
  networkType: "WIFI" | "CELLULAR_4G" | "CELLULAR_5G" | "OFFLINE";
}

export interface NarrationSession {
  poi: POI;
  audio: AudioInfo;
  startedAt: Date;
  queueSessionId?: number;
  activeNarrationId?: number;
}
