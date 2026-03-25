import axios from "@/api/axios";
import { API_ENDPOINTS } from "@/constants";

/** POI admin — khớp ResAdminPOIDTO backend */
export interface AdminPOI {
  id: number;
  // ===== USER =====
  userId: number | null;
  userEmail: string | null;
  userFullName: string | null;
  // ===== THÔNG TIN ẨM THỰC (từ POI) =====
  foodName: string | null;
  price: number | null;
  description: string | null;
  imageUrl: string | null;
  // ===== VỊ TRÍ =====
  address: string | null;
  category: string | null;
  openHours: string | null;
  phone: string | null;
  // ===== GPS =====
  latitude: number | null;
  longitude: number | null;
  accuracy: number | null;
  triggerRadiusMeters: number | null;
  priority: number | null;
  // ===== TRẠNG THÁI =====
  isActive: boolean | null;
  viewCount: number | null;
  likeCount: number | null;
  qrCode: string | null;
  version: number | null;
  // ===== NHÀ HÀNG =====
  restaurantId: number | null;
  // ===== TIMESTAMPS =====
  createdAt: string;
  updatedAt: string | null;
}

export interface UpsertPOIRequest {
  userId?: number | null;
  foodName?: string;
  price?: number;
  description?: string;
  imageUrl?: string;
  address?: string;
  category?: string;
  openHours?: string;
  phone?: string;
  // GPS
  latitude?: number;
  longitude?: number;
  accuracy?: number;
  triggerRadiusMeters?: number;
  priority?: number;
  restaurantId?: number | null;
}

interface ResultPaginationPayload {
  meta: {
    page: number;
    pageSize: number;
    pages: number;
    total: number;
  };
  result: AdminPOI[];
}

/** Unwrap RestResponse.data từ axios interceptor */
function unwrapData<T>(raw: any): T | undefined {
  if (raw == null) return undefined;
  if (raw.data !== undefined && typeof raw === "object" && "statusCode" in raw) {
    return raw.data as T;
  }
  return raw as T;
}

export const fetchAdminPOIsAPI = (
  page = 1,
  size = 10,
  sortBy = "createdAt",
  sortDir: "asc" | "desc" = "desc"
) => {
  return axios.get(API_ENDPOINTS.ADMIN.POIS, {
    params: { page, size, sortBy, sortDir },
  });
};

export const parseAdminPOIListResponse = (raw: any): { data: AdminPOI[]; total: number } => {
  const payload = unwrapData<ResultPaginationPayload>(raw);
  if (payload?.meta && Array.isArray(payload.result)) {
    return { data: payload.result, total: payload.meta.total };
  }
  const direct = raw?.data as ResultPaginationPayload | undefined;
  if (direct?.meta && Array.isArray(direct.result)) {
    return { data: direct.result, total: direct.meta.total };
  }
  return { data: [], total: 0 };
};

export const getAdminPOIByIdAPI = (id: number) => {
  return axios.get(API_ENDPOINTS.ADMIN.POI_BY_ID(id));
};

export const unwrapAdminPOI = (raw: any): AdminPOI | null => {
  const d = unwrapData<AdminPOI>(raw);
  if (d && typeof d.id === "number") return d;
  const inner = raw?.data as AdminPOI | undefined;
  if (inner && typeof inner.id === "number") return inner;
  return null;
};

export const createAdminPOIAPI = (body: UpsertPOIRequest) => {
  return axios.post(API_ENDPOINTS.ADMIN.POIS, body);
};

export const updateAdminPOIAPI = (id: number, body: UpsertPOIRequest) => {
  return axios.put(API_ENDPOINTS.ADMIN.POI_BY_ID(id), body);
};

export const deleteAdminPOIAPI = (id: number) => {
  return axios.delete(API_ENDPOINTS.ADMIN.POI_BY_ID(id));
};
