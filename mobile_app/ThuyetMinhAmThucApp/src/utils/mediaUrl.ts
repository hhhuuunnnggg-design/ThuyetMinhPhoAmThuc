import { getApiBaseUrl } from "./apiUrl";

/**
 * Backend lưu imageUrl/audio dạng `/uploads/...` — ghép base API để thiết bị tải được.
 * URL tuyệt đối trỏ `localhost` / `127.0.0.1` (từ DB hoặc admin cũ) phải đổi host sang máy chạy backend
 * (vd 192.168.x.x), nếu không điện thoại sẽ tải nhầm về chính nó → đồng bộ audio = 0 file.
 */
export function resolveMediaUrl(url: string | null | undefined): string | null {
  if (url == null || String(url).trim() === "") return null;
  const trimmed = String(url).trim();
  if (/^https?:\/\//i.test(trimmed)) {
    try {
      const u = new URL(trimmed);
      const h = u.hostname.toLowerCase();
      if (h === "localhost" || h === "127.0.0.1") {
        const base = getApiBaseUrl().replace(/\/$/, "");
        return `${base}${u.pathname}${u.search}${u.hash}`;
      }
    } catch {
      /* ignore */
    }
    return trimmed;
  }
  const base = getApiBaseUrl().replace(/\/$/, "");
  const path = trimmed.startsWith("/") ? trimmed : `/${trimmed}`;
  return `${base}${path}`;
}
