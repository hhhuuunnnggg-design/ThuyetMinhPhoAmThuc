/**
 * Spring backend trả về body trực tiếp (mảng hoặc object), không bọc ApiResult.
 * Axios: res.data chính là body đó.
 */
export function unwrapListResponse<T>(data: unknown): T[] {
  if (Array.isArray(data)) return data as T[];
  if (data && typeof data === "object") {
    const o = data as Record<string, unknown>;
    if (Array.isArray(o.data)) return o.data as T[];
    if (Array.isArray(o.result)) return o.result as T[];
  }
  return [];
}

export function unwrapEntityResponse<T>(data: unknown): T | null {
  if (data == null) return null;
  if (Array.isArray(data)) return null;
  if (typeof data !== "object") return null;
  const o = data as Record<string, unknown>;
  if (o.data != null && typeof o.data === "object" && !Array.isArray(o.data)) {
    return o.data as T;
  }
  if (o.result != null && typeof o.result === "object" && !Array.isArray(o.result)) {
    return o.result as T;
  }
  return data as T;
}
