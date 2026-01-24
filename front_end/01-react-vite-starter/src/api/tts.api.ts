// api/tts.api.ts
import axios from "@/api/axios";
import { API_ENDPOINTS } from "@/constants";

export interface Voice {
  name: string;
  description: string;
  code: string;
  location: "BAC" | "NAM" | "TRUNG";
}

export interface IVoicesData {
  voices: Voice[];
}

export interface TTSRequest {
  text: string;
  voice: string;
  speed?: number;
  ttsReturnOption?: number; // 2: wav, 3: mp3
  withoutFilter?: boolean;
}

// Lấy danh sách giọng đọc
export const getVoicesAPI = () => {
  return axios.get<IBackendRes<IVoicesData>>(API_ENDPOINTS.TTS.VOICES);
};

// Chuyển đổi text thành speech
export const synthesizeSpeechAPI = (request: TTSRequest) => {
  return axios.post<Blob>(API_ENDPOINTS.TTS.SYNTHESIZE, request, {
    responseType: "blob", // Quan trọng: để nhận audio file
  });
};
