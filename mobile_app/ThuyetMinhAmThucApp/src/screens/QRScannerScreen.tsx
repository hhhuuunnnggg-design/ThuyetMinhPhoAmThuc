import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from "react-native";
import { CameraView, useCameraPermissions } from "expo-camera";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import * as Haptics from "expo-haptics";
import api from "../services/api";
import { unwrapEntityResponse } from "../utils/apiResponse";
import { POI } from "../types";

type RootStackParamList = {
  Home: undefined;
  POIDetail: { poi: POI };
  QRScanner: undefined;
};

const QRScannerScreen: React.FC = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    requestPermission();
  }, []);

  const handleBarCodeScanned = async ({ type, data }: { type: string; data: string }) => {
    if (scanned || loading) return;
    setScanned(true);
    setLoading(true);

    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    try {
      // data có thể là POI ID hoặc QR code string
      let poi: any = null;

      // Thử tìm theo QR code
      try {
        const res: any = await api.get(`/api/v1/app/pois/qr/${data}`);
        poi = unwrapEntityResponse<POI>(res.data);
      } catch {}

      // Thử tìm theo ID
      if (!poi) {
        try {
          const id = parseInt(data);
          if (!isNaN(id)) {
            const res: any = await api.get(`/api/v1/app/pois/${id}`);
            poi = unwrapEntityResponse<POI>(res.data);
          }
        } catch {}
      }

      if (poi) {
        navigation.navigate("POIDetail", { poi });
      } else {
        Alert.alert(
          "Không tìm thấy",
          `Không tìm thấy POI với mã: ${data}`,
          [
            {
              text: "Quét lại",
              onPress: () => setScanned(false),
            },
            {
              text: "Quay lại",
              onPress: () => navigation.goBack(),
            },
          ]
        );
      }
    } catch (error: any) {
      Alert.alert("Lỗi", "Không thể tra cứu POI: " + (error?.message || "Lỗi không xác định"), [
        { text: "Thử lại", onPress: () => setScanned(false) },
      ]);
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
          <Text style={styles.hintText}>
            {loading
              ? "Đang tra cứu..."
              : "Đưa mã QR vào khung hình"}
          </Text>
          {loading && <ActivityIndicator color="#fff" style={{ marginTop: 10 }} />}
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
});

export default QRScannerScreen;
