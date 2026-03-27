import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  ScrollView,
} from "react-native";
import { CameraView, useCameraPermissions } from "expo-camera";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import * as Haptics from "expo-haptics";
import api from "../services/api";
import { unwrapEntityResponse } from "../utils/apiResponse";
import {
  extractPoiQrFromScan,
  tryExtractNumericIdFromUrlPath,
} from "../utils/qrScan";
import { POI } from "../types";

type RootStackParamList = {
  Home: undefined;
  POIDetail: { poi: POI; openedFromQr?: boolean };
  QRScanner: undefined;
};

const QRScannerScreen: React.FC = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [loading, setLoading] = useState(false);
  const [scanError, setScanError] = useState<string | null>(null);
  const cooldownUntilRef = useRef(0);

  useEffect(() => {
    requestPermission();
  }, []);

  const resetForRescan = () => {
    setScanError(null);
    setScanned(false);
    cooldownUntilRef.current = Date.now() + 600;
  };

  const handleBarCodeScanned = async ({ type, data }: { type: string; data: string }) => {
    if (scanned || loading) return;
    if (Date.now() < cooldownUntilRef.current) return;
    setScanned(true);
    setLoading(true);
    setScanError(null);

    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    try {
      const raw = data.trim();
      const code = extractPoiQrFromScan(raw);
      let poi: POI | null = null;

      try {
        const res: any = await api.get(`/api/v1/app/pois/qr/${encodeURIComponent(code)}`);
        poi = unwrapEntityResponse<POI>(res.data);
      } catch {
        /* ignore */
      }

      if (!poi) {
        try {
          const id = parseInt(code, 10);
          if (!Number.isNaN(id)) {
            const res: any = await api.get(`/api/v1/app/pois/${id}`);
            poi = unwrapEntityResponse<POI>(res.data);
          }
        } catch {
          /* ignore */
        }
      }

      if (!poi) {
        const tailId = tryExtractNumericIdFromUrlPath(raw);
        if (tailId != null) {
          try {
            const res: any = await api.get(`/api/v1/app/pois/${tailId}`);
            poi = unwrapEntityResponse<POI>(res.data);
          } catch {
            /* ignore */
          }
        }
      }

      if (poi) {
        navigation.navigate("POIDetail", { poi, openedFromQr: true });
        setScanned(false);
      } else {
        const preview =
          raw.length > 72 ? `${raw.slice(0, 70)}…` : raw;
        const msg =
          "Không tìm thấy địa điểm trong hệ thống.\n\n" +
          "QR phải là mã do Admin Phố Ẩm Thực tạo (cột QR → Tải PNG), hoặc UUID/số id POI của backend.\n\n" +
          "Mã vừa quét:\n" +
          preview;
        setScanError(msg);
        void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
        Alert.alert(
          "Không tìm thấy POI",
          "Chi tiết và mã vừa quét hiển thị ở khung phía dưới. Dùng QR từ Admin → Quản lý POI (Tải PNG).",
          [{ text: "Đã hiểu", onPress: () => {} }]
        );
      }
    } catch (error: any) {
      const errMsg = "Không thể tra cứu: " + (error?.message || "Lỗi không xác định");
      setScanError(errMsg);
      Alert.alert("Lỗi", errMsg, [{ text: "Thử lại", onPress: resetForRescan }]);
    } finally {
      setLoading(false);
    }
  };

  if (!permission) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#ff6b35" />
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={styles.permissionContainer}>
        <Text style={styles.permissionEmoji}>📷</Text>
        <Text style={styles.permissionTitle}>Cần quyền camera</Text>
        <Text style={styles.permissionText}>
          Ứng dụng cần quyền truy cập camera để quét mã QR
        </Text>
        <TouchableOpacity style={styles.permissionButton} onPress={requestPermission}>
          <Text style={styles.permissionButtonText}>Cấp quyền</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>Quay lại</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <CameraView
        style={styles.camera}
        facing="back"
        barcodeScannerSettings={{
          barcodeTypes: ["qr"],
        }}
        onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
      />

      {/* Overlay */}
      <View style={styles.overlay}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={styles.closeButton}>✕ Đóng</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.scanArea}>
          <View style={styles.cornerTL} />
          <View style={styles.cornerTR} />
          <View style={styles.cornerBL} />
          <View style={styles.cornerBR} />
        </View>

        <View style={styles.footer}>
          {scanError ? (
            <View style={styles.errorPanel}>
              <ScrollView style={styles.errorScroll} nestedScrollEnabled>
                <Text style={styles.errorText}>{scanError}</Text>
              </ScrollView>
              <TouchableOpacity style={styles.retryButton} onPress={resetForRescan} activeOpacity={0.85}>
                <Text style={styles.retryButtonText}>↻ Quét lại</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <>
              <Text style={styles.hintText}>
                {loading ? "Đang tra cứu..." : "Đưa mã QR POI (Admin) vào khung"}
              </Text>
              {loading && <ActivityIndicator color="#fff" style={{ marginTop: 10 }} />}
            </>
          )}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
  },
  permissionContainer: {
    flex: 1,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
    padding: 40,
  },
  permissionEmoji: {
    fontSize: 64,
    marginBottom: 20,
  },
  permissionTitle: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 10,
  },
  permissionText: {
    fontSize: 14,
    color: "#888",
    textAlign: "center",
    marginBottom: 30,
  },
  permissionButton: {
    backgroundColor: "#ff6b35",
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 30,
    marginBottom: 16,
  },
  permissionButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  backButton: {
    paddingVertical: 12,
  },
  backButtonText: {
    color: "#888",
    fontSize: 14,
  },
  camera: {
    flex: 1,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "space-between",
  },
  header: {
    paddingTop: 60,
    paddingHorizontal: 20,
    alignItems: "flex-end",
  },
  closeButton: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
    backgroundColor: "rgba(0,0,0,0.5)",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  scanArea: {
    alignSelf: "center",
    width: 260,
    height: 260,
    position: "relative",
  },
  cornerTL: {
    position: "absolute",
    top: 0,
    left: 0,
    width: 40,
    height: 40,
    borderTopWidth: 4,
    borderLeftWidth: 4,
    borderColor: "#ff6b35",
    borderTopLeftRadius: 16,
  },
  cornerTR: {
    position: "absolute",
    top: 0,
    right: 0,
    width: 40,
    height: 40,
    borderTopWidth: 4,
    borderRightWidth: 4,
    borderColor: "#ff6b35",
    borderTopRightRadius: 16,
  },
  cornerBL: {
    position: "absolute",
    bottom: 0,
    left: 0,
    width: 40,
    height: 40,
    borderBottomWidth: 4,
    borderLeftWidth: 4,
    borderColor: "#ff6b35",
    borderBottomLeftRadius: 16,
  },
  cornerBR: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: 40,
    height: 40,
    borderBottomWidth: 4,
    borderRightWidth: 4,
    borderColor: "#ff6b35",
    borderBottomRightRadius: 16,
  },
  footer: {
    paddingBottom: 80,
    alignItems: "center",
  },
  hintText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "500",
    textAlign: "center",
    backgroundColor: "rgba(0,0,0,0.5)",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  errorPanel: {
    width: "92%",
    maxWidth: 400,
    backgroundColor: "rgba(30,10,10,0.92)",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#f97316",
    padding: 12,
    marginBottom: 8,
  },
  errorScroll: {
    maxHeight: 140,
    marginBottom: 10,
  },
  errorText: {
    color: "#ffedd5",
    fontSize: 13,
    lineHeight: 19,
  },
  retryButton: {
    backgroundColor: "#ff6b35",
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: "center",
  },
  retryButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },
});

export default QRScannerScreen;
