/**
 * QR payload parser cho luồng QR → POI của dự án Thuyết Minh Phố Ẩm Thực.
 *
 * Hỗ trợ 3 format:
 *  1. JSON payload: { "type": "poi", "lookup": { "mode": "qr"|"id", "value": "..." } }
 *  2. URL:  https://domain/open-poi?qr=<uuid>  (từ admin web buildPoiQrPayload)
 *  3. Raw:  UUID string hoặc số nguyên ID
 */

export type QrParseResult =
  | { mode: "qr"; value: string }      // qrCode UUID / raw string
  | { mode: "id"; value: number }       // poiId số nguyên
  | { mode: "unknown"; raw: string };   // không nhận dạng được

/**
 * Parse chuỗi quét QR thành kết quả định danh POI.
 *
 * Thứ tự ưu tiên:
 *  1. JSON payload có `type === "poi"` + trường `lookup`
 *  2. URL có query param `?qr=`
 *  3. Số nguyên → mode "id"
 *  4. Chuỗi bất kỳ → mode "qr" (UUID hoặc raw qrCode)
 */
export function parsePoiQrPayload(raw: string): QrParseResult {
  const t = raw.trim();
  if (!t) return { mode: "unknown", raw: t };

  // ── 1. JSON payload ──────────────────────────────────────────────────────────
  if (t.startsWith("{")) {
    try {
      const obj = JSON.parse(t) as Record<string, unknown>;
      if (obj.type === "poi") {
        // Format chuẩn: { type: "poi", lookup: { mode: "qr"|"id", value: "..." } }
        const lookup = obj.lookup as Record<string, unknown> | undefined;
        if (lookup && lookup.mode === "id" && lookup.value != null) {
          const id = Number(lookup.value);
          if (Number.isFinite(id) && id > 0) return { mode: "id", value: Math.round(id) };
        }
        if (lookup && lookup.mode === "qr" && typeof lookup.value === "string") {
          const v = lookup.value.trim();
          if (v) return { mode: "qr", value: v };
        }
        // Fallback: poiId trực tiếp trên root
        if (obj.poiId != null) {
          const id = Number(obj.poiId);
          if (Number.isFinite(id) && id > 0) return { mode: "id", value: Math.round(id) };
        }
        // Fallback: qrCode trực tiếp trên root
        if (typeof obj.qrCode === "string" && obj.qrCode.trim()) {
          return { mode: "qr", value: obj.qrCode.trim() };
        }
        // fallbackUrl → thử parse lại như URL
        if (typeof obj.fallbackUrl === "string") {
          return parsePoiQrPayload(obj.fallbackUrl);
        }
      }
    } catch {
      /* không phải JSON hợp lệ, bỏ qua */
    }
  }

  // ── 2. URL có ?qr= ────────────────────────────────────────────────────────────
  if (t.startsWith("http://") || t.startsWith("https://")) {
    try {
      const u = new URL(t);
      const q = u.searchParams.get("qr");
      if (q && q.trim()) return { mode: "qr", value: q.trim() };
    } catch {
      /* ignore */
    }
  }

  // ── 3. Số nguyên thuần ────────────────────────────────────────────────────────
  if (/^\d+$/.test(t)) {
    const id = parseInt(t, 10);
    if (id > 0) return { mode: "id", value: id };
  }

  // ── 4. Raw string (UUID hoặc qrCode bất kỳ) ──────────────────────────────────
  return { mode: "qr", value: t };
}

/**
 * Backward-compat: trả về chuỗi qrCode / UUID thuần như cũ.
 * Vẫn dùng được ở các chỗ chưa migrate sang parsePoiQrPayload.
 *
 * @deprecated Dùng parsePoiQrPayload() trực tiếp để xử lý cả mode "id".
 */
export function extractPoiQrFromScan(raw: string): string {
  const result = parsePoiQrPayload(raw);
  if (result.mode === "id") return String(result.value);
  if (result.mode === "qr") return result.value;
  return raw.trim();
}
