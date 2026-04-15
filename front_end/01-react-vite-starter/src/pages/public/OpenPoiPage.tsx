import { getPOIByQrAPI, type POI, type AudioInfo } from "@/api/app.api";
import { getImageUrl } from "@/api/tts.api";
import { ROUTES } from "@/constants";
import { useMemo, useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";

// ============ Helpers ============

const LANGUAGE_LABELS: Record<string, string> = {
  vi: "🇻🇳 Tiếng Việt",
  en: "🇬🇧 English",
  zh: "🇨🇳 中文",
  ja: "🇯🇵 日本語",
  ko: "🇰🇷 한국어",
  fr: "🇫🇷 Français",
  de: "🇩🇪 Deutsch",
};

/** Deep link scheme cho app (nếu đã khai báo trong app config). */
function buildAppDeepLink(qr: string): string {
  return `vinhkhanh://poi?qr=${encodeURIComponent(qr)}`;
}

// ============ Component ============

/**
 * Trang mở khi quét QR địa điểm bằng camera điện thoại (không qua app).
 *
 * Luồng:
 *  1. Đọc ?qr= từ URL
 *  2. Gọi GET /api/v1/app/pois/qr/{qrCode} → JSON POI
 *  3. Hiển thị: ảnh, tên, giá, mô tả, địa chỉ, giờ mở cửa, audio badges
 *  4. CTA: mở app qua deep link
 */
const OpenPoiPage = () => {
  const [params] = useSearchParams();
  const qr = useMemo(() => (params.get("qr") || "").trim(), [params]);

  const [poi, setPoi] = useState<POI | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!qr) return;
    let cancelled = false;
    setLoading(true);
    setError(null);
    setPoi(null);

    getPOIByQrAPI(qr)
      .then((res) => {
        if (cancelled) return;
        // Unwrap envelope: { data: { data: POI } } hoặc { data: POI }
        const raw = res.data as any;
        const entity: POI = raw?.data ?? raw;
        if (!entity || typeof entity !== "object" || !entity.id) {
          setError("Không tìm thấy địa điểm với mã QR này.");
        } else {
          setPoi(entity);
        }
      })
      .catch((e: any) => {
        if (cancelled) return;
        const status = e?.response?.status;
        if (status === 404 || status === 400) {
          setError("Không tìm thấy địa điểm với mã QR này.");
        } else {
          setError("Không thể kết nối máy chủ. Vui lòng thử lại sau.");
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [qr]);

  // Danh sách ngôn ngữ audio có sẵn
  const audioEntries: [string, AudioInfo][] = poi?.audios
    ? (Object.entries(poi.audios) as [string, AudioInfo][])
    : [];

  const imageUrl = poi ? getImageUrl(poi.imageUrl) : null;

  return (
    <div style={outerStyle}>
      <div style={cardStyle}>
        {/* Header */}
        <div style={headerStyle}>
          <span style={logoEmojiStyle}>🍜</span>
          <div>
            <div style={brandStyle}>Vĩnh Khánh</div>
            <div style={subBrandStyle}>Phố ẩm thực — Thuyết minh tự động</div>
          </div>
        </div>

        {/* ── Nội dung chính ── */}
        {!qr && (
          <StatusBox
            icon="⚠️"
            title="Thiếu tham số QR"
            desc='URL không chứa tham số "?qr=". Hãy quét lại mã QR.'
            color="#dc2626"
          />
        )}

        {qr && loading && (
          <div style={loadingBox}>
            <div style={spinnerStyle} />
            <p style={loadingText}>Đang tải thông tin địa điểm…</p>
          </div>
        )}

        {qr && !loading && error && (
          <StatusBox icon="❌" title="Không tìm thấy địa điểm" desc={error} color="#dc2626" />
        )}

        {qr && !loading && !error && poi && (
          <POICard poi={poi} qr={qr} imageUrl={imageUrl} audioEntries={audioEntries} />
        )}

        <div style={footerStyle}>
          <Link to={ROUTES.HOME} style={backLinkStyle}>
            ← Về trang chủ web
          </Link>
        </div>
      </div>
    </div>
  );
};

// ============ Sub-components ============

function StatusBox({
  icon,
  title,
  desc,
  color,
}: {
  icon: string;
  title: string;
  desc: string;
  color: string;
}) {
  return (
    <div style={{ textAlign: "center", padding: "32px 8px" }}>
      <div style={{ fontSize: 48 }}>{icon}</div>
      <h2 style={{ color, marginTop: 12, marginBottom: 8 }}>{title}</h2>
      <p style={{ color: "#64748b", lineHeight: 1.6 }}>{desc}</p>
    </div>
  );
}

function POICard({
  poi,
  qr,
  imageUrl,
  audioEntries,
}: {
  poi: POI;
  qr: string;
  imageUrl: string | null;
  audioEntries: [string, AudioInfo][];
}) {
  const deepLink = buildAppDeepLink(qr);

  return (
    <>
      {/* Ảnh */}
      {imageUrl ? (
        <img
          src={imageUrl}
          alt={poi.foodName ?? "Ảnh địa điểm"}
          style={heroImageStyle}
          onError={(e) => {
            (e.target as HTMLImageElement).style.display = "none";
          }}
        />
      ) : (
        <div style={heroPlaceholderStyle}>
          <span style={{ fontSize: 64 }}>🍜</span>
        </div>
      )}

      {/* Tên + giá */}
      <div style={infoSection}>
        {poi.category && <span style={categoryBadge}>{poi.category}</span>}
        <h1 style={foodNameStyle}>{poi.foodName || `POI #${poi.id}`}</h1>

        {poi.price != null && (
          <div style={priceStyle}>
            {Number(poi.price).toLocaleString("vi-VN")}₫
            <span style={priceUnitStyle}> / suất</span>
          </div>
        )}

        {/* Thông tin phụ */}
        {poi.address && <InfoRow icon="📍" label="Địa chỉ" value={poi.address} />}
        {poi.openHours && <InfoRow icon="🕐" label="Giờ mở cửa" value={poi.openHours} />}
        {poi.phone && <InfoRow icon="📞" label="Liên hệ" value={poi.phone} />}

        {/* Mô tả */}
        {poi.description && (
          <div style={descSection}>
            <div style={sectionTitle}>Giới thiệu</div>
            <p style={descStyle}>{poi.description}</p>
          </div>
        )}

        {/* Audio badges */}
        {audioEntries.length > 0 && (
          <div style={audioSection}>
            <div style={sectionTitle}>🎙 Ngôn ngữ thuyết minh</div>
            <div style={audioBadgeRow}>
              {audioEntries.map(([lang]) => (
                <span key={lang} style={audioBadge}>
                  {LANGUAGE_LABELS[lang] ?? lang}
                </span>
              ))}
            </div>
            <p style={audioHintText}>Mở app để nghe thuyết minh tự động.</p>
          </div>
        )}
      </div>

      {/* CTA — mở app */}
      <div style={ctaSection}>
        <a href={deepLink} style={openAppBtn}>
          📱 Mở trong ứng dụng
        </a>
        <p style={ctaHint}>Chưa có app? Tải tại App Store / Google Play.</p>
      </div>
    </>
  );
}

function InfoRow({
  icon,
  label,
  value,
}: {
  icon: string;
  label: string;
  value: string;
}) {
  return (
    <div style={infoRow}>
      <span style={infoLabel}>
        {icon} {label}
      </span>
      <span style={infoValue}>{value}</span>
    </div>
  );
}

// ============ Styles ============

const outerStyle: React.CSSProperties = {
  minHeight: "100vh",
  display: "flex",
  alignItems: "flex-start",
  justifyContent: "center",
  padding: "24px 16px 48px",
  background: "linear-gradient(135deg, #fff7ed 0%, #fef3c7 50%, #ecfdf5 100%)",
};

const cardStyle: React.CSSProperties = {
  maxWidth: 480,
  width: "100%",
  background: "#ffffff",
  borderRadius: 20,
  boxShadow: "0 4px 24px rgba(0,0,0,0.10)",
  overflow: "hidden",
  marginTop: 16,
};

const headerStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 12,
  padding: "16px 20px",
  borderBottom: "1px solid #f1f5f9",
  background: "#fff7ed",
};

const logoEmojiStyle: React.CSSProperties = {
  fontSize: 36,
  lineHeight: 1,
};

const brandStyle: React.CSSProperties = {
  fontWeight: 700,
  fontSize: 18,
  color: "#ea580c",
  letterSpacing: "-0.3px",
};

const subBrandStyle: React.CSSProperties = {
  fontSize: 12,
  color: "#94a3b8",
  marginTop: 2,
};

const heroImageStyle: React.CSSProperties = {
  width: "100%",
  height: 220,
  objectFit: "cover",
  display: "block",
};

const heroPlaceholderStyle: React.CSSProperties = {
  width: "100%",
  height: 160,
  background: "#fef9f0",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
};

const infoSection: React.CSSProperties = {
  padding: "20px 20px 0",
};

const categoryBadge: React.CSSProperties = {
  display: "inline-block",
  padding: "2px 10px",
  background: "#fff7ed",
  color: "#ea580c",
  borderRadius: 20,
  fontSize: 12,
  fontWeight: 600,
  marginBottom: 8,
  border: "1px solid #fed7aa",
};

const foodNameStyle: React.CSSProperties = {
  fontSize: 26,
  fontWeight: 800,
  color: "#1e293b",
  margin: "0 0 6px",
  lineHeight: 1.25,
};

const priceStyle: React.CSSProperties = {
  fontSize: 22,
  fontWeight: 700,
  color: "#ea580c",
  marginBottom: 16,
};

const priceUnitStyle: React.CSSProperties = {
  fontSize: 14,
  fontWeight: 500,
  color: "#b45309",
};

const infoRow: React.CSSProperties = {
  display: "flex",
  gap: 8,
  marginBottom: 10,
  alignItems: "flex-start",
};

const infoLabel: React.CSSProperties = {
  minWidth: 112,
  fontSize: 13,
  color: "#94a3b8",
  flexShrink: 0,
};

const infoValue: React.CSSProperties = {
  fontSize: 13,
  color: "#475569",
  lineHeight: 1.5,
};

const descSection: React.CSSProperties = {
  marginTop: 16,
};

const sectionTitle: React.CSSProperties = {
  fontSize: 14,
  fontWeight: 600,
  color: "#334155",
  marginBottom: 6,
};

const descStyle: React.CSSProperties = {
  fontSize: 14,
  color: "#475569",
  lineHeight: 1.7,
  margin: 0,
};

const audioSection: React.CSSProperties = {
  marginTop: 20,
};

const audioBadgeRow: React.CSSProperties = {
  display: "flex",
  flexWrap: "wrap",
  gap: 8,
  marginTop: 8,
};

const audioBadge: React.CSSProperties = {
  padding: "4px 12px",
  background: "#f0fdf4",
  color: "#16a34a",
  borderRadius: 20,
  fontSize: 13,
  fontWeight: 500,
  border: "1px solid #bbf7d0",
};

const audioHintText: React.CSSProperties = {
  fontSize: 12,
  color: "#94a3b8",
  marginTop: 8,
  lineHeight: 1.5,
};

const ctaSection: React.CSSProperties = {
  padding: "20px 20px 8px",
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  gap: 8,
};

const openAppBtn: React.CSSProperties = {
  display: "block",
  width: "100%",
  textAlign: "center",
  padding: "14px 0",
  background: "linear-gradient(90deg, #ea580c, #f97316)",
  color: "#fff",
  borderRadius: 14,
  fontSize: 16,
  fontWeight: 700,
  textDecoration: "none",
  boxShadow: "0 4px 14px rgba(234,88,12,0.35)",
  letterSpacing: "0.2px",
};

const ctaHint: React.CSSProperties = {
  fontSize: 12,
  color: "#94a3b8",
  margin: 0,
};

const footerStyle: React.CSSProperties = {
  padding: "12px 20px 20px",
  textAlign: "center",
};

const backLinkStyle: React.CSSProperties = {
  color: "#94a3b8",
  fontSize: 13,
  textDecoration: "none",
};

const loadingBox: React.CSSProperties = {
  padding: "48px 20px",
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  gap: 16,
};

const loadingText: React.CSSProperties = {
  color: "#94a3b8",
  fontSize: 14,
  margin: 0,
};

const spinnerStyle: React.CSSProperties = {
  width: 40,
  height: 40,
  border: "4px solid #fed7aa",
  borderTopColor: "#ea580c",
  borderRadius: "50%",
  animation: "spin 0.8s linear infinite",
};

export default OpenPoiPage;
