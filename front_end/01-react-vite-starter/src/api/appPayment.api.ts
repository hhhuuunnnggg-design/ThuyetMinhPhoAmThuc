import axios from "@/api/axios";
import { API_ENDPOINTS } from "@/constants";

export interface AppPaymentDTO {
  id: number;
  userId?: string;
  poiId?: number | null;
  poiName?: string | null;
  amount?: number | null;
  currency?: string | null;
  status?: string | null;
  payosTransactionId?: string | null;
  payosPaymentLink?: string | null;
  payosQrCode?: string | null;
  description?: string | null;
}

function unwrapData<T>(raw: unknown): T | undefined {
  if (raw == null) return undefined;
  if (typeof raw === "object" && raw !== null && "statusCode" in raw && "data" in raw) {
    return (raw as { data: T }).data;
  }
  return raw as T;
}

/**
 * Giống app mobile: tạo giao dịch PayOS rồi mở checkoutUrl.
 */
export async function createAppPaymentAPI(body: {
  poiId: number;
  userId: string;
  amount: number;
  description?: string;
}): Promise<AppPaymentDTO | null> {
  const raw = await axios.post(API_ENDPOINTS.APP.PAYMENT_CREATE, body);
  const d = unwrapData<AppPaymentDTO>(raw);
  if (d && typeof d.id === "number") return d;
  const inner = (raw as { data?: AppPaymentDTO })?.data;
  if (inner && typeof inner.id === "number") return inner;
  return null;
}
