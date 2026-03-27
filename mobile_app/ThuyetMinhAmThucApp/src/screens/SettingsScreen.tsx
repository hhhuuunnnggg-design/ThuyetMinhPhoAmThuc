import React, { useCallback, useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Platform,
  ActivityIndicator,
  Alert,
} from "react-native";
import { storageService } from "../services/storage";
import { deviceService } from "../services/device";
import { offlineDbService } from "../services/offlineDb";
import { offlineSyncService } from "../services/offlineSync";
import { LANGUAGE_LABELS, APP_CONFIG } from "../constants";
import { getApiBaseUrl } from "../utils/apiUrl";

const LANG_KEYS = Object.keys(LANGUAGE_LABELS) as (keyof typeof LANGUAGE_LABELS)[];

interface DeviceCapability {
  ramMB: number;
  storageFreeMB: number;
  capable: boolean;
  poiCount: number;
  lastSync: string | null;
  syncing: boolean;
}

const SettingsScreen: React.FC = () => {
  const [lang, setLang] = useState("vi");
  const [offline, setOffline] = useState(false);
  const [capability, setCapability] = useState<DeviceCapability | null>(null);
  const [syncLoading, setSyncLoading] = useState(false);

  const load = useCallback(async () => {
    const [l, o] = await Promise.all([
      storageService.getPreferredLanguage(),
      storageService.isOfflineModeEnabled(),
    ]);
    setLang(l);
    setOffline(o);

    // Kiểm tra khả năng offline
    const info = await deviceService.getDeviceInfo();
    const capable =
      info.ramMB >= APP_CONFIG.MIN_RAM_MB &&
      info.storageFreeMB >= APP_CONFIG.MIN_STORAGE_MB;

    const [poiCount, lastSync] = await Promise.all([
      offlineDbService.getPoiCount(),
      offlineDbService.getLastSyncTime(),
    ]);

    setCapability({ ramMB: info.ramMB, storageFreeMB: info.storageFreeMB, capable, poiCount, lastSync, syncing: false });
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const onSelectLang = async (code: string) => {
    setLang(code);
    await storageService.setPreferredLanguage(code);
  };

  const onToggleOffline = async (v: boolean) => {
    if (!capability?.capable && v) {
      Alert.alert(
        "Thiết bị không đủ điều kiện",
        `Máy của bạn cần ít nhất:\n• RAM: ${APP_CONFIG.MIN_RAM_MB} MB (hiện có: ${capability?.ramMB} MB)\n• Storage trống: ${APP_CONFIG.MIN_STORAGE_MB} MB (hiện có: ${capability?.storageFreeMB} MB)\n\nVui lòng giải phóng bộ nhớ hoặc dùng thiết bị khác.`
      );
      return;
    }
    setOffline(v);
    await storageService.setOfflineModeEnabled(v);

    // Bật offline → trigger full sync
    if (v) {
      setSyncLoading(true);
      const preferredLang = await storageService.getPreferredLanguage();
      const result = await offlineSyncService.fullSync(preferredLang);
      setSyncLoading(false);
      if (result.error) {
        Alert.alert("Sync thất bại", result.error);
      } else {
        await load(); // refresh lại UI
        Alert.alert(
          "Đồng bộ xong",
          `Đã lưu ${result.poiCount} POI và tải ${result.audioCount} file MP3 về máy (metadata audio luôn được lưu).`
        );
      }
    } else {
      // Tắt offline → xóa cache SQLite
      await offlineDbService.clearAll();
      await load();
    }
  };

  const onClearCache = async () => {
    Alert.alert(
      "Xóa cache",
      "Xóa toàn bộ dữ liệu offline (POI, audio đã tải)? Hành động này không thể hoàn tác.",
      [
        { text: "Hủy", style: "cancel" },
        {
          text: "Xóa",
          style: "destructive",
          onPress: async () => {
            setSyncLoading(true);
            try {
              await offlineDbService.clearAll();
              await load();
              Alert.alert("Đã xóa", "Cache offline đã được xóa. Vào lại dữ liệu mới khi bật đồng bộ.");
            } finally {
              setSyncLoading(false);
            }
          },
        },
      ]
    );
  };

  const onSync = async () => {
    setSyncLoading(true);
    const preferredLang = await storageService.getPreferredLanguage();
    // fullSync đã tự xóa cache trước khi đồng bộ
    const result = await offlineSyncService.fullSync(preferredLang);
    setSyncLoading(false);
    if (result.error) {
      Alert.alert("Sync thất bại", result.error);
    } else {
      await load();
      Alert.alert(
        "Đồng bộ thành công",
        `Đã cập nhật ${result.poiCount} POI, tải ${result.audioCount} file MP3 về máy.`
      );
    }
  };

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Cài đặt</Text>
      <Text style={styles.sub}>Ngôn ngữ thuyết minh mặc định</Text>

      <View style={styles.card}>
        {LANG_KEYS.map((code) => (
          <TouchableOpacity
            key={code}
            style={[styles.langRow, lang === code && styles.langRowActive]}
            onPress={() => onSelectLang(code)}
            activeOpacity={0.7}
          >
            <View style={[styles.dot, { backgroundColor: lang === code ? "#ff6b35" : "#ddd" }]} />
            <Text style={[styles.langLabel, lang === code && styles.langLabelActive]}>
              {LANGUAGE_LABELS[code]}
            </Text>
            <Text style={styles.langCode}>{code}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* ====== OFFLINE SECTION ====== */}
      <Text style={[styles.sub, styles.mt]}>Chế độ Offline</Text>

      {/* Device capability card */}
      {capability && (
        <View style={[styles.capabilityCard, !capability.capable && styles.capabilityCardWarn]}>
          <Text style={styles.capabilityTitle}>
            {capability.capable ? "✅ Thiết bị hỗ trợ Offline" : "⚠️ Thiết bị không đủ điều kiện"}
          </Text>
          <Text style={styles.capabilityRow}>
            RAM: {capability.ramMB} MB
            {capability.ramMB < APP_CONFIG.MIN_RAM_MB ? " < " + APP_CONFIG.MIN_RAM_MB + " MB ❌" : " ≥ " + APP_CONFIG.MIN_RAM_MB + " MB ✅"}
          </Text>
          <Text style={styles.capabilityRow}>
            Storage: {capability.storageFreeMB} MB trống
            {capability.storageFreeMB < APP_CONFIG.MIN_STORAGE_MB ? " < " + APP_CONFIG.MIN_STORAGE_MB + " MB ❌" : " ≥ " + APP_CONFIG.MIN_STORAGE_MB + " MB ✅"}
          </Text>
          {offline && (
            <>
              <Text style={styles.capabilityRow}>
                POI đã lưu: {capability.poiCount}
              </Text>
              {capability.lastSync && (
                <Text style={styles.capabilityRow}>
                  Sync lần cuối: {new Date(capability.lastSync).toLocaleString("vi-VN")}
                </Text>
              )}
            </>
          )}
        </View>
      )}

      <View style={styles.rowSwitch}>
        <View style={{ flex: 1 }}>
          <Text style={styles.switchLabel}>Bật chế độ offline</Text>
          <Text style={styles.switchSub}>
            {offline ? "📥 Đang dùng dữ liệu cục bộ" : "📡 Phát trực tuyến từ server"}
          </Text>
        </View>
        <Switch
          value={offline}
          onValueChange={onToggleOffline}
          disabled={!capability?.capable && !offline}
          trackColor={{ false: "#ccc", true: "#ffb899" }}
          thumbColor={offline ? "#ff6b35" : "#f4f4f4"}
        />
      </View>

      {/* Sync button — chỉ hiện khi offline bật */}
      {offline && (
        <>
          <TouchableOpacity
            style={[styles.syncButton, syncLoading && styles.syncButtonDisabled]}
            onPress={onSync}
            disabled={syncLoading}
            activeOpacity={0.7}
          >
            {syncLoading ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.syncButtonText}>🔄 Đồng bộ lại dữ liệu</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.clearButton, syncLoading && styles.clearButtonDisabled]}
            onPress={onClearCache}
            disabled={syncLoading}
            activeOpacity={0.7}
          >
            <Text style={styles.clearButtonText}>🗑 Xóa cache offline</Text>
          </TouchableOpacity>
        </>
      )}

      {__DEV__ && (
        <Text style={styles.debug}>API: {getApiBaseUrl()} ({Platform.OS})</Text>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: "#f8f9fa" },
  content: { padding: 20, paddingTop: 56, paddingBottom: 40 },
  title: { fontSize: 24, fontWeight: "700", color: "#222", marginBottom: 8 },
  sub: { fontSize: 14, color: "#666", marginBottom: 12 },
  mt: { marginTop: 20 },
  card: {
    backgroundColor: "#fff",
    borderRadius: 12,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#eee",
  },
  langRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  langRowActive: { backgroundColor: "#fff8f5" },
  dot: { width: 10, height: 10, borderRadius: 5, marginRight: 12 },
  langLabel: { flex: 1, fontSize: 16, color: "#333" },
  langLabelActive: { fontWeight: "600", color: "#ff6b35" },
  langCode: { fontSize: 12, color: "#999", textTransform: "uppercase" },
  rowSwitch: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#eee",
  },
  switchLabel: { fontSize: 16, color: "#333" },
  switchSub: { fontSize: 12, color: "#888", marginTop: 2 },
  capabilityCard: {
    backgroundColor: "#f0fdf4",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#bbf7d0",
  },
  capabilityCardWarn: {
    backgroundColor: "#fefce8",
    borderColor: "#fde68a",
  },
  capabilityTitle: { fontSize: 15, fontWeight: "600", color: "#333", marginBottom: 8 },
  capabilityRow: { fontSize: 13, color: "#555", marginTop: 3 },
  syncButton: {
    backgroundColor: "#ff6b35",
    borderRadius: 12,
    padding: 14,
    alignItems: "center",
    marginTop: 12,
  },
  syncButtonDisabled: { opacity: 0.6 },
  syncButtonText: { color: "#fff", fontSize: 15, fontWeight: "600" },
  clearButton: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 14,
    alignItems: "center",
    marginTop: 8,
    borderWidth: 1,
    borderColor: "#e53935",
  },
  clearButtonDisabled: { opacity: 0.5 },
  clearButtonText: { color: "#e53935", fontSize: 15, fontWeight: "600" },
  debug: { marginTop: 24, fontSize: 11, color: "#aaa", fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace" },
});

export default SettingsScreen;
