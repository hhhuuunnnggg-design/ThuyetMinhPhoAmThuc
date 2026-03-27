// constants/index.ts
// Application constants

export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: "/api/v1/auth/login",
    REGISTER: "/api/v1/auth/register",
    LOGOUT: "/api/v1/auth/logout",
    ACCOUNT: "/api/v1/auth/account",
    REFRESH: "/api/v1/auth/refresh",
    SOCIAL_LOGIN: (loginType: "google" | "facebook") =>
      `/api/v1/auth/social/login?login_type=${loginType}`,
    SOCIAL_CALLBACK: (loginType: "google" | "facebook", code: string) =>
      `/api/v1/auth/social/callback?login_type=${loginType}&code=${code}`,
  },
  USERS: {
    FETCH_ALL: "/api/v1/users/fetch-all",
    CREATE: "/api/v1/users/add-user",
    UPDATE: (id: number) => `/api/v1/users/${id}`,
    DELETE: (id: number) => `/api/v1/users/${id}`,
    CHANGE_ACTIVITY: (id: number) => `/api/v1/users/changeActivity/${id}`,
    ADMIN_CREATE: "/api/v1/users/admin/create",
    ADMIN_UPDATE: (id: number) => `/api/v1/users/admin/${id}`,
  },
  ROLES: {
    FETCH_ALL: "/api/v1/roles/fetch-all",
    CREATE: "/api/v1/roles/create",
    UPDATE: (id: number) => `/api/v1/roles/${id}`,
    DELETE: (id: number) => `/api/v1/roles/${id}`,
  },
  PERMISSIONS: {
    FETCH_ALL: "/api/v1/permissions/fetch-all",
    CREATE: "/api/v1/permissions/create",
    UPDATE: (id: number) => `/api/v1/permissions/${id}`,
    DELETE: (id: number) => `/api/v1/permissions/${id}`,
  },
  TTS: {
    SYNTHESIZE: "/api/v1/tts/synthesize",
    SYNTHESIZE_AND_SAVE: "/api/v1/tts/synthesize-and-save",
    VOICES: "/api/v1/tts/voices",
    AUDIOS: "/api/v1/tts/audios",
    AUDIO_BY_ID: (id: number) => `/api/v1/tts/audios/${id}`,
    AUDIO_DOWNLOAD: (id: number) => `/api/v1/tts/audios/${id}/download`,
    /** Phát đúng file theo ngôn ngữ trong nhóm (cùng groupKey, khác languageCode). */
    AUDIO_STREAM: (id: number, languageCode: string) =>
      `/api/v1/tts/audios/${id}/stream?languageCode=${encodeURIComponent(languageCode)}`,
    AUDIO_IMAGE: (id: number) => `/api/v1/tts/audios/${id}/image`,
    AUDIO_GENERATE_MULTILINGUAL: (id: number) => `/api/v1/tts/audios/${id}/generate-multilingual`,
    IMAGE_UPLOAD: "/api/v1/tts/images/upload",
    MULTILINGUAL: "/api/v1/tts/multilingual",
    GROUP_BY_ID: (id: number) => `/api/v1/tts/groups/${id}`,
    GROUP_BY_KEY: (key: string) => `/api/v1/tts/groups/key/${key}`,
    GROUP_AUDIO: (groupKey: string, lang: string) => `/api/v1/tts/groups/${groupKey}/audio/${lang}`,
    GROUP_GENERATE_MULTILINGUAL: (id: number) => `/api/v1/tts/groups/${id}/generate-multilingual`,
    GROUPS: "/api/v1/tts/groups",
  },
  APP: {
    POIS: "/api/v1/app/pois",
    POI_BY_ID: (id: number) => `/api/v1/app/pois/${id}`,
    POI_BY_QR: (qr: string) => `/api/v1/app/pois/qr/${qr}`,
    POIS_NEARBY: "/api/v1/app/pois/nearby",
    DEVICE_REGISTER: "/api/v1/app/device/register",
    DEVICE_SYNC: "/api/v1/app/device/sync",
    DEVICE_CONFIG: "/api/v1/app/device/config",
    DEVICE_RUNNING_MODE: "/api/v1/app/device/running-mode",
    NARRATION_CHECK: "/api/v1/app/narration/check",
    NARRATION_START: "/api/v1/app/narration/start",
    NARRATION_END: "/api/v1/app/narration/end",
    NARRATION_LOG: "/api/v1/app/narration/log",
    DASHBOARD_ACTIVE: "/api/v1/app/dashboard/active",
    DASHBOARD_ACTIVE_COUNT: "/api/v1/app/dashboard/active-count",
    PAYMENT_CREATE: "/api/v1/app/payment/create",
    PAYMENT_BY_ID: (id: number) => `/api/v1/app/payment/${id}`,
    PAYMENT_WEBHOOk: "/api/v1/app/payment/webhook",
  },
  ADMIN: {
    NARRATION_LOGS: "/api/v1/admin/narration-logs",
    DASHBOARD: "/api/v1/admin/dashboard",
    DASHBOARD_POI_QUEUE: "/api/v1/admin/dashboard/poi-queue",
    DASHBOARD_ACTIVE_NARRATIONS: "/api/v1/admin/dashboard/active-narrations",
    DASHBOARD_TOP_POIS: "/api/v1/admin/dashboard/top-pois",
    POIS: "/api/v1/admin/pois",
    POI_BY_ID: (id: number) => `/api/v1/admin/pois/${id}`,
    POI_STATS: (id: number) => `/api/v1/admin/pois/${id}/stats`,
    RESTAURANTS: "/api/v1/admin/restaurants",
    LOAD_TEST_START: "/api/v1/admin/load-test/start",
    TRANSLATION_CORPUS: "/api/v1/admin/translation/corpus",
    TRANSLATION_STATS: "/api/v1/admin/translation/stats",
    TRANSLATION_VALIDATE: (id: number) => `/api/v1/admin/translation/validate/${id}`,
  },
} as const;

export const STORAGE_KEYS = {
  ACCESS_TOKEN: "access_token",
} as const;

export const ROUTES = {
  HOME: "/",
  LOGIN: "/login",
  REGISTER: "/register",
  ADMIN: {
    BASE: "/admin",
    USER: "/admin/user",
    ROLE: "/admin/role",
    PERMISSION: "/admin/permission",
    TTS_AUDIO: "/admin/tts-audio",
    TTS_GROUPS: "/admin/tts-groups",
    NARRATION_LOGS: "/admin/narration-logs",
    POIS: "/admin/pois",
    DASHBOARD_REALTIME: "/admin/dashboard-realtime",
    TOP_POIS: "/admin/top-pois",
    RESTAURANTS: "/admin/restaurants",
    PAYMENTS: "/admin/payments",
    LOAD_TEST: "/admin/load-test",
    TRANSLATION: "/admin/translation",
  },
  PAYMENT: {
    SUCCESS: "/payment/success",
    CANCEL: "/payment/cancel",
  },
  /** QR địa điểm (mở bằng camera → trang hướng dẫn / app) */
  OPEN_POI: "/open-poi",
  TTS: "/tts",
} as const;
