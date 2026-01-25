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
    MY_AUDIOS: "/api/v1/tts/audios/my",
    AUDIO_BY_ID: (id: number) => `/api/v1/tts/audios/${id}`,
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
  },
  TTS: "/tts",
} as const;
