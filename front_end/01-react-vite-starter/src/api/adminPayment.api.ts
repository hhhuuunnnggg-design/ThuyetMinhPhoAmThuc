import axios from "@/api/axios";
import { API_ENDPOINTS } from "@/constants";

export interface AdminPaymentRecord {
  id: number;
  userId: string;
  poiId: number | null;
  poiName: string | null;
  restaurantId: number | null;
  restaurantName: string | null;
  amount: number;
  quantity: number | null;
  currency: string;
  status: string;
  payosTransactionId: string | null;
  payosPaymentLinkId: string | null;
  payosPaymentLink: string | null;
  payosQrCode?: string | null;
  paidAt: string | null;
  createdAt: string;
  description: string | null;
}

export interface AdminPaymentStatsMonth {
  monthKey: string;
  totalRevenueVnd: number;
  completedOrdersCount: number;
  pendingCount: number;
  successCount: number;
  cancelledCount: number;
  failedCount: number;
  otherStatusCount: number;
  dailyRevenue: { dayOfMonth: string; amountVnd: number }[];
}

interface ResultPaginationPayload {
  meta: {
    page: number;
    pageSize: number;
    pages: number;
    total: number;
  };
  result: AdminPaymentRecord[];
}

function unwrapData<T>(raw: unknown): T | undefined {
  if (raw == null) return undefined;
  if (
    typeof raw === "object" &&
    raw !== null &&
    "data" in raw &&
    "statusCode" in raw
  ) {
    return (raw as { data: T }).data;
  }
  return raw as T;
}

export const fetchAdminPaymentsAPI = (params: {
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortDir?: "asc" | "desc";
  poiName?: string;
  userId?: string;
  status?: string;
  restaurantId?: number;
}) => {
  return axios.get(API_ENDPOINTS.ADMIN.PAYMENTS, {
    params: {
      page: params.page ?? 1,
      size: params.pageSize ?? 20,
      sortBy: params.sortBy ?? "createdAt",
      sortDir: params.sortDir ?? "desc",
      poiName: params.poiName,
      userId: params.userId,
      status: params.status,
      restaurantId: params.restaurantId,
    },
  });
};

export const parseAdminPaymentListResponse = (
  raw: unknown
): { data: AdminPaymentRecord[]; total: number } => {
  const payload = unwrapData<ResultPaginationPayload>(raw);
  if (payload?.meta && Array.isArray(payload.result)) {
    return { data: payload.result, total: payload.meta.total };
  }
  const direct = (raw as { data?: ResultPaginationPayload })?.data;
  if (direct?.meta && Array.isArray(direct.result)) {
    return { data: direct.result, total: direct.meta.total };
  }
  return { data: [], total: 0 };
};

export const fetchAdminPaymentsStatsMonthAPI = () => {
  return axios.get(API_ENDPOINTS.ADMIN.PAYMENTS_STATS_MONTH);
};

export const parseAdminPaymentStatsResponse = (
  raw: unknown
): AdminPaymentStatsMonth | null => {
  const d = unwrapData<AdminPaymentStatsMonth>(raw);
  if (d && typeof d.monthKey === "string") return d;
  const inner = (raw as { data?: AdminPaymentStatsMonth })?.data;
  if (inner && typeof inner.monthKey === "string") return inner;
  return null;
};

export const syncAdminPaymentPayOSAPI = (id: number) => {
  return axios.post(API_ENDPOINTS.ADMIN.PAYMENT_SYNC_PAYOS(id));
};
