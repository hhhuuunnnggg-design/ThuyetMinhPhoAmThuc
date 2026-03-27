import React, { useCallback, useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Platform,
} from "react-native";
import { storageService } from "../services/storage";
import { LANGUAGE_LABELS } from "../constants";
import { getApiBaseUrl } from "../utils/apiUrl";

const LANG_KEYS = Object.keys(LANGUAGE_LABELS) as (keyof typeof LANGUAGE_LABELS)[];

const SettingsScreen: React.FC = () => {
  const [lang, setLang] = useState("vi");
  const [offline, setOffline] = useState(false);

  const load = useCallback(async () => {
    const [l, o] = await Promise.all([
      storageService.getPreferredLanguage(),
      storageService.isOfflineModeEnabled(),
    ]);
    setLang(l);
    setOffline(o);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const onSelectLang = async (code: string) => {
    setLang(code);
    await storageService.setPreferredLanguage(code);
  };

  const onToggleOffline = async (v: boolean) => {
    setOffline(v);
    await storageService.setOfflineModeEnabled(v);
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

      <Text style={[styles.sub, styles.mt]}>Chế độ offline (tải trước audio)</Text>
      <View style={styles.rowSwitch}>
        <Text style={styles.switchLabel}>Bật chế độ offline</Text>
        <Switch value={offline} onValueChange={onToggleOffline} trackColor={{ false: "#ccc", true: "#ffb899" }} thumbColor={offline ? "#ff6b35" : "#f4f4f4"} />
      </View>

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
  switchLabel: { fontSize: 16, color: "#333", flex: 1 },
  debug: { marginTop: 24, fontSize: 11, color: "#aaa", fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace" },
});

export default SettingsScreen;
