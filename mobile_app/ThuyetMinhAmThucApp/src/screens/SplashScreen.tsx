import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  Image,
} from "react-native";
import * as Haptics from "expo-haptics";
import { deviceService } from "../services/device";
import { storageService } from "../services/storage";
import { offlineSyncService } from "../services/offlineSync";
import api from "../services/api";
import { APP_CONFIG } from "../constants";

interface Props {
  onReady: () => void;
}

const SplashScreen: React.FC<Props> = ({ onReady }) => {
  const initialized = useRef(false);
  const [loadingText, setLoadingText] = useState("Đang khởi động...");

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    const init = async () => {
      try {
        // 1. Get/create device ID
        const deviceId = await deviceService.getDeviceId();
        const deviceInfo = await deviceService.getDeviceInfo();
        const offlineCapable = await deviceService.isCapableOfOffline();
        const runningMode = deviceService.determineRunningMode(deviceInfo);

        // 2. Register device with backend
        try {
          await api.post("/api/v1/app/device/register", {
            deviceId,
            osVersion: deviceInfo.osVersion,
            appVersion: deviceInfo.appVersion,
            ramMB: deviceInfo.ramMB,
            storageFreeMB: deviceInfo.storageFreeMB,
            networkType: deviceInfo.networkType,
          });
        } catch (e) {
          console.log("Device registration failed:", e);
        }

        // 3. Nếu offline mode đang bật → kiểm tra năng lực thiết bị
        const offlineEnabled = await storageService.isOfflineModeEnabled();
        if (offlineEnabled && offlineCapable) {
          // Đủ điều kiện → tự đồng bộ ngay
          setLoadingText("Đang đồng bộ dữ liệu offline...");
          const preferredLang = await storageService.getPreferredLanguage();
          const result = await offlineSyncService.fullSync(preferredLang);
          if (result.error) {
            console.warn("Auto sync failed:", result.error);
          } else {
            console.log(`Auto sync done: ${result.poiCount} POI, ${result.audioCount} audio`);
          }
        } else if (offlineEnabled && !offlineCapable) {
          // Đã bật offline nhưng không đủ điều kiện → tắt offline
          await storageService.setOfflineModeEnabled(false);
          setLoadingText("Thiết bị không đủ điều kiện offline...");
        }

        // 4. Save config locally
        await storageService.setDeviceConfig({
          deviceId,
          runningMode,
          deviceInfo,
        });

        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } catch (error) {
        console.error("Splash init error:", error);
      } finally {
        setTimeout(onReady, 1500);
      }
    };

    init();
  }, [onReady]);

  return (
    <View style={styles.container}>
      <View style={styles.logoContainer}>
        <Text style={styles.logoEmoji}>🍜</Text>
        <Text style={styles.logoText}>Thuyết Minh</Text>
        <Text style={styles.logoSubtext}>Phố Ẩm Thực</Text>
      </View>

      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#ff6b35" />
        <Text style={styles.loadingText}>{loadingText}</Text>
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>Tự động thuyết minh ẩm thực</Text>
        <Text style={styles.footerSubtext}>với AI & Đa ngôn ngữ</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
  },
  logoContainer: {
    alignItems: "center",
    marginBottom: 60,
  },
  logoEmoji: {
    fontSize: 80,
    marginBottom: 16,
  },
  logoText: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#ff6b35",
    letterSpacing: 1,
  },
  logoSubtext: {
    fontSize: 20,
    color: "#666",
    marginTop: 4,
  },
  loadingContainer: {
    alignItems: "center",
    marginBottom: 80,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: "#888",
  },
  footer: {
    position: "absolute",
    bottom: 60,
    alignItems: "center",
  },
  footerText: {
    fontSize: 13,
    color: "#aaa",
  },
  footerSubtext: {
    fontSize: 12,
    color: "#ccc",
    marginTop: 2,
  },
});

export default SplashScreen;
