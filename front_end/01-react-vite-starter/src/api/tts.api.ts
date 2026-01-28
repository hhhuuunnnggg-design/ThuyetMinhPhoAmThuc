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

  // Thông tin thuyết minh ẩm thực (dùng cho GPS Food Guide)
  foodName?: string;
  price?: number;
  description?: string;
  imageUrl?: string;

  // Thông tin vị trí (GPS)
  latitude?: number;
  longitude?: number;
  accuracy?: number;
}

export interface TTSAudio {
  id: number;
  text: string;
  voice: string;
  speed: number;
  format: number;
  withoutFilter: boolean;
  fileName: string;
  s3Url: string | null; // Có thể null nếu S3 không được cấu hình
  fileSize: number;
  mimeType: string;
  createdAt: string;
  updatedAt: string | null;
  createdBy: string;

  // Thông tin thuyết minh ẩm thực
  foodName?: string | null;
  price?: number | null;
  description?: string | null;
  imageUrl?: string | null;

  // Thông tin vị trí (GPS)
  latitude?: number | null;
  longitude?: number | null;
  accuracy?: number | null;
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

// Chuyển đổi text thành speech và lưu lên S3
export const synthesizeAndSaveAPI = (request: TTSRequest) => {
  return axios.post<IBackendRes<TTSAudio>>(API_ENDPOINTS.TTS.SYNTHESIZE_AND_SAVE, request);
};

// Lấy danh sách TTS audios
// Response bị wrap trong RestResponse: { statusCode, error, message, data: IModelPaginate<TTSAudio> }
export const getTTSAudiosAPI = (page: number = 1, size: number = 10) => {
  return axios.get<IBackendRes<IModelPaginate<TTSAudio>>>(API_ENDPOINTS.TTS.AUDIOS, {
    params: { page, size },
  });
};

// Lấy danh sách TTS audios của user hiện tại
export const getMyTTSAudiosAPI = () => {
  return axios.get<IBackendRes<TTSAudio[]>>(API_ENDPOINTS.TTS.MY_AUDIOS);
};

// Lấy TTS audio theo ID
export const getTTSAudioByIdAPI = (id: number) => {
  return axios.get<IBackendRes<TTSAudio>>(API_ENDPOINTS.TTS.AUDIO_BY_ID(id));
};

// Cập nhật TTS audio
export const updateTTSAudioAPI = (id: number, request: TTSRequest) => {
  return axios.put<IBackendRes<TTSAudio>>(API_ENDPOINTS.TTS.AUDIO_BY_ID(id), request);
};

// Xóa TTS audio
export const deleteTTSAudioAPI = (id: number) => {
  return axios.delete<IBackendRes<void>>(API_ENDPOINTS.TTS.AUDIO_BY_ID(id));
};

// Tải xuống hoặc phát TTS audio (sử dụng khi không có S3 URL)
export const downloadTTSAudioAPI = (id: number) => {
  return axios.get<Blob>(API_ENDPOINTS.TTS.AUDIO_DOWNLOAD(id), {
    responseType: "blob",
  });
};

// Upload ảnh món ăn lên S3 và cập nhật vào TTSAudio
export const uploadFoodImageAPI = (id: number, imageFile: File) => {
  const formData = new FormData();
  formData.append("image", imageFile);
  return axios.post<IBackendRes<TTSAudio>>(API_ENDPOINTS.TTS.AUDIO_IMAGE(id), formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
};

// Upload ảnh món ăn lên S3 (không cần audio ID)
export const uploadFoodImageOnlyAPI = (imageFile: File) => {
  const formData = new FormData();
  formData.append("image", imageFile);
  return axios.post<IBackendRes<{ imageUrl: string; message: string }>>(
    API_ENDPOINTS.TTS.IMAGE_UPLOAD,
    formData,
    {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    }
  );
};

// Helper function để lấy image URL (bucket đã public, dùng trực tiếp S3 URL)
export const getImageUrl = (imageUrl: string | null | undefined): string | null => {
  if (!imageUrl) return null;
  // Giữ nguyên URL (S3 bucket đã public)
  return imageUrl;
};
