import axios, { AxiosInstance } from "axios";
import { getApiBaseUrl } from "../utils/apiUrl";
import { unwrapEntityResponse } from "../utils/apiResponse";
import { deviceService } from "./device";
import type { Payment } from "../types";

const BASE_URL = getApiBaseUrl();

const api: AxiosInstance = axios.create({
  baseURL: BASE_URL,
  timeout: 15000,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor – thêm X-Device-Id bắt buộc cho narration endpoints
api.interceptors.request.use(
  async (config) => {
    const narrationEndpoints = [
      "/narration/start",
      "/narration/end",
      "/narration/log",
      "/narration/check",
    ];
    if (narrationEndpoints.some((ep) => config.url?.includes(ep))) {
      const deviceId = await deviceService.getDeviceId();
      config.headers["X-Device-Id"] = deviceId;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Handle unauthorized - maybe redirect to login
    }
    return Promise.reject(error);
  }
);

export default api;

// ============ Device APIs ============

export const registerDevice = async (data: {
  deviceId: string;
  osVersion?: string;
  appVersion?: string;
  ramMB?: number;
  storageFreeMB?: number;
  networkType?: string;
}) => {
  const res = await api.post("/api/v1/app/device/register", data);
  return res.data;
};

export const syncDevice = async (data: {
  deviceId: string;
  latitude?: number;
  longitude?: number;
  downloadedVersions?: string;
}) => {
  const res = await api.post("/api/v1/app/device/sync", data);
  return res.data;
};

export const getDeviceConfig = async (deviceId: string) => {
  const res = await api.get(`/api/v1/app/device/config?deviceId=${deviceId}`);
  return res.data;
};

export const checkRunningMode = async (deviceId: string) => {
  const res = await api.get(`/api/v1/app/device/running-mode?deviceId=${deviceId}`);
  return res.data;
};

// ============ POI APIs ============

export const getPOIs = async () => {
  const res = await api.get("/api/v1/app/pois");
  return res.data;
};

export const getPOIById = async (id: number) => {
  const res = await api.get(`/api/v1/app/pois/${id}`);
  return res.data;
};

export const getPOIByQr = async (qrCode: string) => {
  const res = await api.get(`/api/v1/app/pois/qr/${qrCode}`);
  return res.data;
};

export const getNearbyPOIs = async (lat: number, lng: number, radiusKm = 2) => {
  const res = await api.get(
    `/api/v1/app/pois/nearby?lat=${lat}&lng=${lng}&radiusKm=${radiusKm}`
  );
  return res.data;
};

// ============ Narration APIs ============

export const checkNarration = async (data: {
  deviceId: string;
  ttsAudioId: number;
  clientTimestamp?: number;
}) => {
  const res = await api.post("/api/v1/app/narration/check", data);
  return res.data;
};

export const startNarration = async (data: {
  deviceId: string;
  poiId: number;
  audioId: number;
  languageCode?: string;
  latitude?: number;
  longitude?: number;
}) => {
  const res = await api.post("/api/v1/app/narration/start", data);
  return res.data;
};

export const endNarration = async (data: {
  activeNarrationId: number;
  actualDurationSeconds?: number;
  status: string;
}) => {
  const res = await api.post("/api/v1/app/narration/end", data);
  return res.data;
};

export const logNarration = async (data: {
  deviceId: string;
  ttsAudioId: number;
  playedAt: number;
  durationSeconds?: number;
  status?: string;
}) => {
  const res = await api.post("/api/v1/app/narration/log", data);
  return res.data;
};

// ============ Dashboard ============

export const getActiveNarrations = async () => {
  const res = await api.get("/api/v1/app/dashboard/active");
  return res.data;
};

export const getActiveCountNearby = async (lat: number, lng: number, radiusKm = 2) => {
  const res = await api.get(
    `/api/v1/app/dashboard/active-count?lat=${lat}&lng=${lng}&radiusKm=${radiusKm}`
  );
  return res.data;
};

// ============ Payment ============

export const createPayment = async (data: {
  poiId: number;
  userId: string;
  amount: number;
  description?: string;
}) => {
  const res = await api.post("/api/v1/app/payment/create", data);
  return unwrapEntityResponse<Payment>(res.data) as Payment;
};

export const getPayment = async (id: number) => {
  const res = await api.get(`/api/v1/app/payment/${id}`);
  return unwrapEntityResponse<Payment>(res.data) as Payment;
};

// ============ Audio Streaming ============

export const getAudioUrl = (groupKey: string, lang: string): string => {
  return `${BASE_URL}/api/v1/tts/groups/${groupKey}/audio/${lang}`;
};

export const getAudioStreamUrl = (groupKey: string, lang: string): string => {
  return `${BASE_URL}/api/v1/tts/groups/${groupKey}/audio/${lang}`;
};
