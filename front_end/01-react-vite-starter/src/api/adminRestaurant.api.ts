import axios from "@/api/axios";
import { API_ENDPOINTS } from "@/constants";

export interface AdminRestaurant {
  id: number;
  poiId: number | null;
  ownerName: string | null;
  ownerEmail: string | null;
  ownerPhone: string | null;
  payosClientId: string | null;
  payosApiKey: string | null;
  payosChecksumKey: string | null;
  bankAccount: string | null;
  bankName: string | null;
  commissionRate: number | null;
  isVerified: boolean | null;
  createdAt: string;
  updatedAt: string | null;
}

export interface UpsertRestaurantRequest {
  ownerName: string;
  ownerEmail?: string;
  ownerPhone?: string;
  payosClientId?: string;
  payosApiKey?: string;
  payosChecksumKey?: string;
  bankAccount?: string;
  bankName?: string;
  commissionRate?: number;
}

interface ResultPaginationPayload {
  meta: {
    page: number;
    pageSize: number;
    pages: number;
    total: number;
  };
  result: AdminRestaurant[];
}

function unwrapData<T>(raw: any): T | undefined {
  if (raw == null) return undefined;
  if (raw.data !== undefined && typeof raw === "object" && "statusCode" in raw) {
    return raw.data as T;
  }
  return raw as T;
}

export const fetchAdminRestaurantsAPI = (
  page = 1,
  size = 10,
  sortBy = "createdAt",
  sortDir: "asc" | "desc" = "desc"
) => {
  return axios.get(API_ENDPOINTS.ADMIN.RESTAURANTS, {
    params: { page, size, sortBy, sortDir },
  });
};

export const parseAdminRestaurantListResponse = (
  raw: any
): { data: AdminRestaurant[]; total: number } => {
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

export const getAdminRestaurantByIdAPI = (id: number) => {
  return axios.get(`${API_ENDPOINTS.ADMIN.RESTAURANTS}/${id}`);
};

export const unwrapAdminRestaurant = (raw: any): AdminRestaurant | null => {
  const d = unwrapData<AdminRestaurant>(raw);
  if (d && typeof d.id === "number") return d;
  const inner = raw?.data as AdminRestaurant | undefined;
  if (inner && typeof inner.id === "number") return inner;
  return null;
};

export const createAdminRestaurantAPI = (body: UpsertRestaurantRequest) => {
  return axios.post(API_ENDPOINTS.ADMIN.RESTAURANTS, body);
};

export const updateAdminRestaurantAPI = (
  id: number,
  body: UpsertRestaurantRequest
) => {
  return axios.put(`${API_ENDPOINTS.ADMIN.RESTAURANTS}/${id}`, body);
};

export const deleteAdminRestaurantAPI = (id: number) => {
  return axios.delete(`${API_ENDPOINTS.ADMIN.RESTAURANTS}/${id}`);
};
