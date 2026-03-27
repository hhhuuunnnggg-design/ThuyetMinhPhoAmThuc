import axios from "@/api/axios";
import { API_ENDPOINTS } from "@/constants";

// ============ Types ============

export interface DeviceConfig {
  id: number;
  deviceId: string;
  runningMode: "OFFLINE" | "STREAMING";
  offlineModeEnabled: boolean;
  lastSyncAt: string | null;
  downloadedVersions: string | null;
  appVersionCode: number | null;
  totalDownloadedMB: number;
  lastSeenAt: string | null;
  poisNeedingSync?: Record<number, number>;
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
  isActive: boolean | null;
  viewCount: number;
  likeCount: number;
  qrCode: string | null;
  version: number;
  restaurantName: string | null;
  restaurantVerified: boolean | null;
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
}

export interface NearbyPOI {
  id: number;
  foodName: string;
  imageUrl: string | null;
  latitude: number;
  longitude: number;
  triggerRadiusMeters: number | null;
  priority: number | null;
  price: number | null;
  category: string | null;
  address: string | null;
  distanceMeters: number;
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
  status: string;
  latitude: number;
  longitude: number;
}

// ============ Device APIs ============

export const registerDeviceAPI = (data: {
  deviceId: string;
  osVersion?: string;
  appVersion?: string;
  ramMB?: number;
  storageFreeMB?: number;
  networkType?: string;
}) => {
  return axios.post<IBackendRes<DeviceConfig>>(API_ENDPOINTS.APP.DEVICE_REGISTER, data);
};

export const syncDeviceAPI = (data: {
  deviceId: string;
  latitude?: number;
  longitude?: number;
  downloadedVersions?: string;
}) => {
  return axios.post<IBackendRes<DeviceConfig>>(API_ENDPOINTS.APP.DEVICE_SYNC, data);
};

export const getDeviceConfigAPI = (deviceId: string) => {
  return axios.get<IBackendRes<DeviceConfig>>(
    `${API_ENDPOINTS.APP.DEVICE_CONFIG}?deviceId=${deviceId}`
  );
};

export const checkRunningModeAPI = (deviceId: string) => {
  return axios.get<IBackendRes<string>>(
    `${API_ENDPOINTS.APP.DEVICE_RUNNING_MODE}?deviceId=${deviceId}`
  );
};

// ============ POI APIs ============

export const getPOIsForAppAPI = () => {
  return axios.get<IBackendRes<POI[]>>(API_ENDPOINTS.APP.POIS);
};

export const getPOIByIdAPI = (id: number) => {
  return axios.get<IBackendRes<POI>>(API_ENDPOINTS.APP.POI_BY_ID(id));
};

export const getPOIByQrAPI = (qrCode: string) => {
  return axios.get<IBackendRes<POI>>(API_ENDPOINTS.APP.POI_BY_QR(qrCode));
};

export const getNearbyPOIsAPI = (lat: number, lng: number, radiusKm = 2) => {
  return axios.get<IBackendRes<NearbyPOI[]>>(
    `${API_ENDPOINTS.APP.POIS_NEARBY}?lat=${lat}&lng=${lng}&radiusKm=${radiusKm}`
  );
};

// ============ Narration APIs ============

export interface NarrationCheckRequest {
  deviceId: string;
  ttsAudioId: number;
  clientTimestamp?: number;
}

export interface NarrationCheckResponse {
  shouldPlay: boolean;
  reason?: string | null;
}

export interface NarrationLogRequest {
  deviceId: string;
  ttsAudioId: number;
  playedAt: number;
  durationSeconds?: number;
  status?: string;
}

export interface NarrationStartRequest {
  deviceId: string;
  poiId: number;
  audioId: number;
  languageCode?: string;
  latitude?: number;
  longitude?: number;
}

export interface NarrationEndRequest {
  activeNarrationId: number;
  actualDurationSeconds?: number;
  status: string;
}

export const checkNarrationAPI = (request: NarrationCheckRequest) => {
  return axios.post<IBackendRes<NarrationCheckResponse>>(
    API_ENDPOINTS.APP.NARRATION_CHECK,
    request
  );
};

export const startNarrationAPI = (request: NarrationStartRequest) => {
  const { deviceId, ...body } = request;
  return axios.post<IBackendRes<void>>(API_ENDPOINTS.APP.NARRATION_START, body, {
    headers: {
      "X-Device-Id": deviceId,
    },
  });
};

export const endNarrationAPI = (request: NarrationEndRequest) => {
  return axios.post<IBackendRes<void>>(API_ENDPOINTS.APP.NARRATION_END, request);
};

export const logNarrationAPI = (request: NarrationLogRequest) => {
  return axios.post<IBackendRes<void>>(API_ENDPOINTS.APP.NARRATION_LOG, request);
};

// ============ Dashboard APIs ============

export const getActiveNarrationsAPI = () => {
  return axios.get<IBackendRes<ActiveNarration[]>>(API_ENDPOINTS.APP.DASHBOARD_ACTIVE);
};

export interface TopPOI {
  poiId: number;
  poiName: string;
  address: string | null;
  totalListens: number;
  todayListens: number;
  rank: number;
}

export const getTopPOIsAPI = (from: string, to: string, limit: number = 10) => {
  const q = new URLSearchParams({ from, to, limit: String(limit) });
  return axios.get<IBackendRes<TopPOI[]>>(`${API_ENDPOINTS.ADMIN.DASHBOARD_TOP_POIS}?${q.toString()}`);
};

export const getActiveCountNearbyAPI = (lat: number, lng: number, radiusKm = 2) => {
  return axios.get<IBackendRes<number>>(
    `${API_ENDPOINTS.APP.DASHBOARD_ACTIVE_COUNT}?lat=${lat}&lng=${lng}&radiusKm=${radiusKm}`
  );
};

// ============ Payment APIs ============

export interface PaymentCreateRequest {
  poiId: number;
  userId: string;
  amount: number;
  description?: string;
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
  status: string;
  payosTransactionId: string | null;
  payosPaymentLink: string | null;
  payosQrCode: string | null;
  paidAt: string | null;
  createdAt: string;
  description: string | null;
}

export const createPaymentAPI = (data: PaymentCreateRequest) => {
  return axios.post<IBackendRes<Payment>>(API_ENDPOINTS.APP.PAYMENT_CREATE, data);
};

export const getPaymentAPI = (id: number) => {
  return axios.get<IBackendRes<Payment>>(API_ENDPOINTS.APP.PAYMENT_BY_ID(id));
};
