import { getApiBaseUrl } from "./apiUrl";

/** Backend lưu imageUrl dạng `/uploads/...` — cần ghép base API để Image/浏览器 tải được */
export function resolveMediaUrl(url: string | null | undefined): string | null {
  if (url == null || String(url).trim() === "") return null;
  const trimmed = String(url).trim();
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  const base = getApiBaseUrl().replace(/\/$/, "");
  const path = trimmed.startsWith("/") ? trimmed : `/${trimmed}`;
  return `${base}${path}`;
}
