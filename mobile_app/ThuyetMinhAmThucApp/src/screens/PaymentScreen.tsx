import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  Image,
  Linking,
} from "react-native";
import { RouteProp, useRoute } from "@react-navigation/native";
import QRCode from "react-native-qrcode-svg";
import { createPayment } from "../services/api";
import { deviceService } from "../services/device";
import { POI, Payment } from "../types";

type PaymentRoute = RouteProp<{ Payment: { poi: POI; amount: number } }, "Payment">;

/**
 * PayOS API trả `qrCode` là chuỗi payload VietQR/EMV (vd. bắt đầu 000201...),
 * không phải ảnh PNG base64 — phải vẽ QR từ chuỗi đó.
 * @see https://payos.vn/docs/api/
 */
function isRenderableAsQrMatrix(qr: string | null | undefined): boolean {
  if (!qr || !String(qr).trim()) return false;
  const s = String(qr).trim();
  if (s.startsWith("data:") || s.startsWith("http://") || s.startsWith("https://")) return false;
  // PNG/JPEG base64 thường có prefix này
  if (s.startsWith("iVBOR") || s.startsWith("/9j/")) return false;
  return true;
}

/** Chuỗi là URL ảnh hoặc data URL — dùng Image. */
function qrCodeToImageUri(qr: string | null | undefined): string | null {
  if (!qr || !String(qr).trim()) return null;
  const s = String(qr).trim();
  if (s.startsWith("data:") || s.startsWith("http://") || s.startsWith("https://")) {
    return s;
  }
  if (s.startsWith("iVBOR") || s.startsWith("/9j/")) {
    return `data:image/png;base64,${s}`;
  }
  return null;
}

const PaymentScreen: React.FC = () => {
  const route = useRoute<PaymentRoute>();
  const { poi, amount } = route.params;

  const [loading, setLoading] = useState(true);
  const [payment, setPayment] = useState<Payment | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const userId = await deviceService.getDeviceId();
        const data = await createPayment({
          poiId: poi.id,
          userId,
          amount,
          description: poi.foodName ? `Ủng hộ: ${poi.foodName}` : undefined,
        });
        if (!cancelled) {
          setPayment(data as Payment);
        }
      } catch (e: unknown) {
        const msg = e && typeof e === "object" && "message" in e ? String((e as Error).message) : "Không tạo được thanh toán";
        if (!cancelled) setError(msg);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [poi.id, amount, poi.foodName]);

  const qrPayload = payment?.payosQrCode;
  const showMatrixQr = qrPayload && isRenderableAsQrMatrix(qrPayload);
  const qrImageUri = qrPayload ? qrCodeToImageUri(qrPayload) : null;
  const isMockLink = payment?.payosPaymentLink?.includes("/mock/");

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>{poi.foodName ?? "Thanh toán"}</Text>
      <Text style={styles.amount}>
        Số tiền: {amount.toLocaleString("vi-VN")} ₫
      </Text>

      {loading && (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#ff6b35" />
          <Text style={styles.hint}>Đang tạo link PayOS...</Text>
        </View>
      )}

      {error && !loading && (
        <View style={styles.boxWarn}>
          <Text style={styles.warnText}>{error}</Text>
        </View>
      )}

      {!loading && payment && (
        <>
          {isMockLink && (
            <View style={styles.boxWarn}>
              <Text style={styles.warnText}>
                Backend chưa cấu hình PayOS đủ (client / api key / checksum) hoặc nhà hàng chưa điền đủ — đang dùng link thử.
                Thêm biến PAYOS_* trong .env hoặc cấu hình PayOS trên nhà hàng trong Admin.
              </Text>
            </View>
          )}

          {showMatrixQr && qrPayload ? (
            <View style={styles.qrWrap}>
              <Text style={styles.label}>Mã QR VietQR (PayOS)</Text>
              <View style={styles.qrSvgBox}>
                <QRCode value={qrPayload} size={240} backgroundColor="#fff" color="#000" />
              </View>
            </View>
          ) : qrImageUri ? (
            <View style={styles.qrWrap}>
              <Text style={styles.label}>Mã QR thanh toán</Text>
              <Image source={{ uri: qrImageUri }} style={styles.qrImage} resizeMode="contain" />
            </View>
          ) : (
            <View style={styles.boxInfo}>
              <Text style={styles.infoText}>
                PayOS không trả mã QR trong response — mở trang thanh toán bên dưới để quét QR trên trang PayOS.
              </Text>
            </View>
          )}

          {payment.payosPaymentLink ? (
            <TouchableOpacity
              style={styles.primaryBtn}
              onPress={() => Linking.openURL(payment.payosPaymentLink!)}
              activeOpacity={0.85}
            >
              <Text style={styles.primaryBtnText}>Mở trang thanh toán PayOS</Text>
            </TouchableOpacity>
          ) : null}

          {payment.id != null && (
            <Text style={styles.meta}>Mã giao dịch nội bộ: #{payment.id}</Text>
          )}
        </>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  content: { padding: 20, paddingBottom: 40 },
  title: { fontSize: 20, fontWeight: "700", color: "#222" },
  amount: { fontSize: 16, color: "#ff6b35", marginTop: 8, marginBottom: 16 },
  center: { alignItems: "center", paddingVertical: 24 },
  hint: { marginTop: 12, color: "#888", fontSize: 14 },
  boxWarn: {
    backgroundColor: "#fffbeb",
    borderRadius: 10,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#fde68a",
  },
  warnText: { fontSize: 13, color: "#92400e", lineHeight: 20 },
  boxInfo: {
    backgroundColor: "#f0f9ff",
    borderRadius: 10,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#bae6fd",
  },
  infoText: { fontSize: 13, color: "#0369a1", lineHeight: 20 },
  qrWrap: { alignItems: "center", marginBottom: 20 },
  qrSvgBox: {
    padding: 12,
    backgroundColor: "#fafafa",
    borderRadius: 12,
  },
  label: { fontSize: 15, fontWeight: "600", color: "#333", marginBottom: 10 },
  qrImage: { width: 260, height: 260, backgroundColor: "#fafafa" },
  primaryBtn: {
    backgroundColor: "#ff6b35",
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
  },
  primaryBtnText: { color: "#fff", fontSize: 16, fontWeight: "600" },
  meta: { marginTop: 16, fontSize: 12, color: "#999", textAlign: "center" },
});

export default PaymentScreen;
