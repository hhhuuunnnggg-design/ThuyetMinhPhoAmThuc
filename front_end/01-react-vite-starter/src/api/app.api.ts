// api/app.api.ts
// API client cho mobile app endpoints
import axios from "@/api/axios";
import { API_ENDPOINTS } from "@/constants";

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

// Lấy danh sách POI cho app client
export const getPoisForAppAPI = () => {
  return axios.get<IBackendRes<any[]>>(API_ENDPOINTS.APP.POIS);
};

// Kiểm tra có nên phát narration không
export const checkNarrationAPI = (request: NarrationCheckRequest) => {
  return axios.post<IBackendRes<NarrationCheckResponse>>(API_ENDPOINTS.APP.NARRATION_CHECK, request);
};

// Ghi log narration đã phát
export const logNarrationAPI = (request: NarrationLogRequest) => {
  return axios.post<IBackendRes<void>>(API_ENDPOINTS.APP.NARRATION_LOG, request);
};
