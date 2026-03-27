/**
 * Chuỗi quét được từ QR có thể là:
 * - UUID thuần
 * - URL admin: .../open-poi?qr=<uuid>
 * - URL path: .../open-poi/<uuid> (một số CMS)
 */
export function extractPoiQrFromScan(raw: string): string {
  const t = raw.trim();
  if (!t) return t;
  if (t.startsWith("http://") || t.startsWith("https://")) {
    try {
      const u = new URL(t);
      const q = u.searchParams.get("qr");
      if (q) return q.trim();
      const pathSegs = u.pathname.split("/").filter(Boolean);
      const oi = pathSegs.indexOf("open-poi");
      if (oi >= 0 && pathSegs[oi + 1]) {
        return decodeURIComponent(pathSegs[oi + 1]).trim();
      }
    } catch {
      /* ignore */
    }
  }
  return t;
}

/**
 * Một số QR generic kết thúc bằng /.../123 (vd. mockapi /products/3).
 * Thử coi 123 là id POI nội bộ — chỉ dùng khi tra UUID thất bại.
 */
export function tryExtractNumericIdFromUrlPath(raw: string): number | null {
  const t = raw.trim();
  if (!t.startsWith("http://") && !t.startsWith("https://")) return null;
  try {
    const u = new URL(t);
    const segs = u.pathname.split("/").filter(Boolean);
    const last = segs[segs.length - 1];
    if (!last) return null;
    const n = parseInt(last, 10);
    if (Number.isNaN(n) || n < 1) return null;
    if (String(n) !== last) return null;
    return n;
  } catch {
    return null;
  }
}
