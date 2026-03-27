/**
 * Chuỗi quét được từ QR có thể là UUID thuần hoặc URL dạng .../open-poi?qr=<uuid> (từ admin web).
 */
export function extractPoiQrFromScan(raw: string): string {
  const t = raw.trim();
  if (!t) return t;
  if (t.startsWith("http://") || t.startsWith("https://")) {
    try {
      const u = new URL(t);
      const q = u.searchParams.get("qr");
      if (q) return q.trim();
    } catch {
      /* ignore */
    }
  }
  return t;
}
