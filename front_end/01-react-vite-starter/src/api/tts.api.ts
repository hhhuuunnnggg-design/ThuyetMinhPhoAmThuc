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
  
  // Thông tin POI (Geofence)
  triggerRadiusMeters?: number; // Bán kính kích hoạt (mét)
  priority?: number; // Độ ưu tiên (số càng cao = ưu tiên càng cao)

  // Multilingual
  multilingual?: boolean; // Tự động tạo audio đa ngôn ngữ (EN, ZH, JA, KO, FR)
}

export interface TTSAudio {
  id: number;

  // ===== GROUP INFO =====
  groupId?: number | null;
  groupKey?: string | null;

  // ===== NGÔN NGỮ =====
  languageCode?: string | null; // vi, en, zh, ja, ko, fr

  // ===== NỘI DUNG =====
  text: string;
  voice: string;
  speed: number;
  format: number;
  withoutFilter: boolean;

  // ===== FILE INFO =====
  fileName: string;
  s3Url: string | null;
  fileSize: number;
  mimeType: string;

  // ===== THỜI GIAN =====
  createdAt: string;
  updatedAt: string | null;
  createdBy: string | null;

  // ===== THÔNG TIN ẨM THỰC (từ Group) =====
  foodName?: string | null;
  price?: number | null;
  description?: string | null;
  imageUrl?: string | null;

  // ===== VỊ TRÍ GPS (từ Group) =====
  latitude?: number | null;
  longitude?: number | null;
  accuracy?: number | null;

  // ===== GEOFENCE (từ Group) =====
  triggerRadiusMeters?: number | null;
  priority?: number | null;

  // ===== TEXT GỐC (từ Group) =====
  originalText?: string | null;
  originalVoice?: string | null;

  // ===== USER INFO (từ Group) =====
  userId?: number | null;
  userEmail?: string | null;
  userFullName?: string | null;
  userAvatar?: string | null;
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

// ============ Multi-language TTS ============

export interface MultilingualAudioEntry {
  id: number;
  languageCode: string;
  languageName: string;
  s3Url: string | null;
  fileSize: number;
}

export interface MultilingualAudioResponse {
  groupId: string;
  audios: MultilingualAudioEntry[];
}

export interface TTSAudioGroup {
  id: number;
  groupKey: string;
  foodName: string | null;
  price?: number | null;
  description?: string | null;
  imageUrl?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  accuracy?: number | null;
  triggerRadiusMeters?: number | null;
  priority?: number | null;
  originalText: string | null;
  originalVoice: string | null;
  originalSpeed?: number | null;
  originalFormat?: number | null;
  originalWithoutFilter?: boolean | null;
  createdAt: string;
  updatedAt?: string | null;
  createdBy?: string | null;
  audios: MultilingualAudioEntry[];
}

/** Body cho PUT /tts/groups/{id} — khớp ReqUpdateTTSAudioGroupDTO */
export interface UpdateTTSAudioGroupRequest {
  foodName?: string | null;
  price?: number | null;
  description?: string | null;
  imageUrl?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  accuracy?: number | null;
  triggerRadiusMeters?: number | null;
  priority?: number | null;
  originalText: string;
  originalVoice: string;
  originalSpeed: number;
  originalFormat: number;
  originalWithoutFilter?: boolean;
}

// Tạo audio đa ngôn ngữ
export const createMultilingualTTSAPI = (request: TTSRequest) => {
  return axios.post<IBackendRes<MultilingualAudioResponse>>(API_ENDPOINTS.TTS.MULTILINGUAL, request);
};

// Lấy group audio theo ID
export const getAudioGroupByIdAPI = (id: number) => {
  return axios.get<IBackendRes<TTSAudioGroup>>(API_ENDPOINTS.TTS.GROUP_BY_ID(id));
};

// Lấy group audio theo groupKey
export const getAudioGroupByKeyAPI = (groupKey: string) => {
  return axios.get<IBackendRes<TTSAudioGroup>>(API_ENDPOINTS.TTS.GROUP_BY_KEY(groupKey));
};

// Generate multilingual audio cho audio đã tồn tại
export const generateMultilingualAPI = (audioId: number) => {
  return axios.post<IBackendRes<MultilingualAudioResponse>>(
    API_ENDPOINTS.TTS.AUDIO_GENERATE_MULTILINGUAL(audioId)
  );
};

// ============ Group CRUD ============

export const getTTSGroupsAPI = (page: number = 1, size: number = 10) => {
  return axios.get<IBackendRes<IModelPaginate<TTSAudioGroup>>>(
    API_ENDPOINTS.TTS.GROUPS,
    { params: { page, size } }
  );
};

export const getTTSGroupByIdAPI = (id: number) => {
  return axios.get<IBackendRes<TTSAudioGroup>>(API_ENDPOINTS.TTS.GROUP_BY_ID(id));
};

export const deleteTTSGroupAPI = (id: number) => {
  return axios.delete<IBackendRes<void>>(API_ENDPOINTS.TTS.GROUP_BY_ID(id));
};

export const updateTTSGroupAPI = (id: number, body: UpdateTTSAudioGroupRequest) => {
  return axios.put<IBackendRes<TTSAudioGroup>>(API_ENDPOINTS.TTS.GROUP_BY_ID(id), body);
};

export const generateMultilingualForGroupAPI = (groupId: number) => {
  return axios.post<IBackendRes<MultilingualAudioResponse>>(
    API_ENDPOINTS.TTS.GROUP_GENERATE_MULTILINGUAL(groupId)
  );
};
