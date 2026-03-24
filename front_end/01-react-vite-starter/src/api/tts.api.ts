// api/tts.api.ts
import axios from "@/api/axios";
import { API_ENDPOINTS } from "@/constants";

// ===== GIỌNG ĐỌC =====

export interface Voice {
  name: string;
  description: string;
  code: string;
  location: "BAC" | "NAM" | "TRUNG";
}

export interface IVoicesData {
  voices: Voice[];
}

// ===== REQUEST =====

export interface TTSRequest {
  text: string;
  voice: string;
  speed?: number;
  ttsReturnOption?: number; // 2: wav, 3: mp3
  withoutFilter?: boolean;

  // Thông tin thuyết minh ẩm thực
  foodName?: string;
  price?: number;
  description?: string;
  imageUrl?: string;

  // Thông tin vị trí (GPS)
  latitude?: number;
  longitude?: number;
  accuracy?: number;

  // Thông tin POI (Geofence)
  triggerRadiusMeters?: number;
  priority?: number;
}

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

// ===== RESPONSE =====

/** Audio data — metadata của một file audio trên storage */
export interface AudioData {
  fileName: string;
  s3Url: string | null;
  fileSize: number;
  mimeType: string;
}

/** TTSAudio — chỉ dùng để xem (READ only), có kèm thông tin từ Group */
export interface TTSAudio {
  id: number;
  groupId: number | null;
  groupKey: string | null;
  languageCode: string;
  text: string;
  translatedText: string | null;
  voice: string;
  speed: number;
  createdAt: string;
  updatedAt: string | null;

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

  // ===== AUDIO FILE INFO =====
  fileName?: string | null;
  s3Url?: string | null;
  fileSize?: number | null;
  mimeType?: string | null;
}

/** Nhóm audio TTS — chứa toàn bộ thông tin CRUD + audio đa ngôn ngữ */
export interface TTSAudioGroup {
  id: number;
  groupKey: string;

  // ===== THÔNG TIN ẨM THỰC =====
  foodName: string | null;
  price?: number | null;
  description?: string | null;
  imageUrl?: string | null;

  // ===== VỊ TRÍ GPS =====
  latitude?: number | null;
  longitude?: number | null;
  accuracy?: number | null;

  // ===== GEOFENCE =====
  triggerRadiusMeters?: number | null;
  priority?: number | null;

  // ===== TEXT & VOICE GỐC (tiếng Việt) =====
  originalText: string | null;
  originalVoice: string | null;
  originalSpeed?: number | null;
  originalFormat?: number | null;
  originalWithoutFilter?: boolean | null;

  // ===== AUDIO ĐA NGÔN NGỮ — Map<languageCode, AudioData> =====
  audioMap: Record<string, AudioData>;

  // ===== USER & TIME =====
  createdBy?: string | null;
  createdAt: string;
  updatedAt?: string | null;
}

// ===== API =====

/** Lấy danh sách giọng đọc */
export const getVoicesAPI = () => {
  return axios.get<IBackendRes<IVoicesData>>(API_ENDPOINTS.TTS.VOICES);
};

/** Chuyển đổi text thành speech */
export const synthesizeSpeechAPI = (request: TTSRequest) => {
  return axios.post<Blob>(API_ENDPOINTS.TTS.SYNTHESIZE, request, {
    responseType: "blob",
  });
};

// ===== TTSAudio — chỉ READ =====

/** Lấy danh sách TTS audios (phân trang) */
export const getTTSAudiosAPI = (page: number = 1, size: number = 10) => {
  return axios.get<IBackendRes<IModelPaginate<TTSAudio>>>(API_ENDPOINTS.TTS.AUDIOS, {
    params: { page, size },
  });
};

/** Lấy TTS audio theo ID */
export const getTTSAudioByIdAPI = (id: number) => {
  return axios.get<IBackendRes<TTSAudio>>(API_ENDPOINTS.TTS.AUDIO_BY_ID(id));
};

/** Stream audio: lấy file audio theo audio ID + ngôn ngữ */
export const streamAudioAPI = (audioId: number, languageCode: string) => {
  return axios.get<Blob>(API_ENDPOINTS.TTS.AUDIO_STREAM(audioId, languageCode), {
    responseType: "blob",
  });
};

// ===== Group CRUD =====

/** Tạo nhóm audio TTS mới (kèm tạo audio đa ngôn ngữ) */
export const createTTSGroupAPI = (request: TTSRequest) => {
  return axios.post<IBackendRes<TTSAudioGroup>>(API_ENDPOINTS.TTS.GROUPS, request);
};

/** Lấy danh sách tất cả groups (phân trang) */
export const getTTSGroupsAPI = (page: number = 1, size: number = 10) => {
  return axios.get<IBackendRes<IModelPaginate<TTSAudioGroup>>>(API_ENDPOINTS.TTS.GROUPS, {
    params: { page, size },
  });
};

/** Lấy group audio theo ID (client-side dùng để hiển thị audio đa ngôn ngữ) */
export const getAudioGroupByIdAPI = (id: number) => {
  return axios.get<IBackendRes<TTSAudioGroup>>(API_ENDPOINTS.TTS.GROUP_BY_ID(id));
};

/** Lấy group audio theo groupKey */
export const getTTSGroupByKeyAPI = (groupKey: string) => {
  return axios.get<IBackendRes<TTSAudioGroup>>(API_ENDPOINTS.TTS.GROUP_BY_KEY(groupKey));
};

/** Cập nhật nhóm audio TTS */
export const updateTTSGroupAPI = (id: number, body: UpdateTTSAudioGroupRequest) => {
  return axios.put<IBackendRes<TTSAudioGroup>>(API_ENDPOINTS.TTS.GROUP_BY_ID(id), body);
};

/** Xóa nhóm audio TTS */
export const deleteTTSGroupAPI = (id: number) => {
  return axios.delete<IBackendRes<void>>(API_ENDPOINTS.TTS.GROUP_BY_ID(id));
};

/** Tạo audio đa ngôn ngữ cho group (bổ sung ngôn ngữ chưa có) */
export const generateMultilingualForGroupAPI = (groupId: number) => {
  return axios.post<IBackendRes<Record<string, AudioData>>>(
    API_ENDPOINTS.TTS.GROUP_GENERATE_MULTILINGUAL(groupId)
  );
};

/** Alias cho tương thích ngược với client-side code cũ */
export const generateMultilingualAPI = generateMultilingualForGroupAPI;

/** Lấy file audio: groupKey + languageCode */
export const getGroupAudioAPI = (groupKey: string, languageCode: string) => {
  return axios.get<Blob>(API_ENDPOINTS.TTS.GROUP_AUDIO(groupKey, languageCode), {
    responseType: "blob",
  });
};

// ===== Images =====

/** Upload ảnh món ăn */
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

/** Build full image URL — prepends backend baseURL if imageUrl is a relative path */
export const getImageUrl = (imageUrl: string | null | undefined): string | null => {
  if (!imageUrl) return null;
  if (imageUrl.startsWith("http://") || imageUrl.startsWith("https://")) {
    return imageUrl;
  }
  // Relative path like "food-images/2026/03/25/file.jpg" or "/uploads/file.jpg"
  const base = import.meta.env.VITE_BACKEND_URL || "http://localhost:8080";
  const cleanPath = imageUrl.startsWith("/") ? imageUrl : `/${imageUrl}`;
  return `${base}${cleanPath}`;
};
