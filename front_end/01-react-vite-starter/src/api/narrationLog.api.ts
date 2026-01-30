// api/narrationLog.api.ts
import axios from "@/api/axios";
import { API_ENDPOINTS } from "@/constants";

export interface NarrationLog {
  id: number;
  deviceId: string;
  ttsAudioId: number;
  ttsAudioName: string;
  playedAt: string;
  durationSeconds?: number | null;
  status?: string | null;
  createdAt: string;
}

// Lấy danh sách narration logs (admin)
export const getNarrationLogsAPI = (page: number = 1, size: number = 10) => {
  return axios.get<IBackendRes<IModelPaginate<NarrationLog>>>(API_ENDPOINTS.ADMIN.NARRATION_LOGS, {
    params: { page, size },
  });
};
