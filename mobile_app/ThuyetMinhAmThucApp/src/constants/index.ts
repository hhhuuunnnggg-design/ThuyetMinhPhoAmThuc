import Constants from "expo-constants";

const API_BASE_URL = Constants.expoConfig?.extra?.apiBaseUrl || "http://10.0.2.2:8080"; // Android emulator
// const API_BASE_URL = Constants.expoConfig?.extra?.apiBaseUrl || "http://localhost:8080"; // iOS

export const API_ENDPOINTS = {
  // Device
  DEVICE_REGISTER: "/api/v1/app/device/register",
  DEVICE_SYNC: "/api/v1/app/device/sync",
  DEVICE_CONFIG: "/api/v1/app/device/config",
  DEVICE_RUNNING_MODE: "/api/v1/app/device/running-mode",

  // POI
  POIS: "/api/v1/app/pois",
  POI_BY_ID: (id: number) => `/api/v1/app/pois/${id}`,
  POI_BY_QR: (qr: string) => `/api/v1/app/pois/qr/${qr}`,
  POIS_NEARBY: "/api/v1/app/pois/nearby",

  // Narration
  NARRATION_CHECK: "/api/v1/app/narration/check",
  NARRATION_START: "/api/v1/app/narration/start",
  NARRATION_END: "/api/v1/app/narration/end",
  NARRATION_LOG: "/api/v1/app/narration/log",

  // Dashboard
  DASHBOARD_ACTIVE: "/api/v1/app/dashboard/active",
  DASHBOARD_ACTIVE_COUNT: "/api/v1/app/dashboard/active-count",

  // Payment
  PAYMENT_CREATE: "/api/v1/app/payment/create",
  PAYMENT_BY_ID: (id: number) => `/api/v1/app/payment/${id}`,
  PAYMENT_WEBHOOK: "/api/v1/app/payment/webhook",
} as const;

export const APP_CONFIG = {
  // Minimum config for offline mode
  MIN_RAM_MB: 4096,
  MIN_STORAGE_MB: 500,

  // Cooldown before playing same POI again (ms)
  COOLDOWN_MS: 5 * 60 * 1000,

  // Polling intervals
  ACTIVE_NARRATION_POLL_MS: 5000,
  LOCATION_UPDATE_MS: 3000,

  // Audio
  DEFAULT_LANGUAGE: "vi",
  AUDIO_FORMAT: 3, // 3 = mp3

  // Geofence
  DEFAULT_RADIUS_METERS: 50,
  NEARBY_RADIUS_KM: 2.0,
} as const;

export const LANGUAGE_LABELS: Record<string, string> = {
  vi: "Vietnamese",
  en: "English",
  zh: "Chinese",
  ja: "Japanese",
  ko: "Korean",
  fr: "French",
};

export const LANGUAGE_COLORS: Record<string, string> = {
  vi: "#ff6b35",
  en: "#3b82f6",
  zh: "#ef4444",
  ja: "#ec4899",
  ko: "#8b5cf6",
  fr: "#10b981",
};
