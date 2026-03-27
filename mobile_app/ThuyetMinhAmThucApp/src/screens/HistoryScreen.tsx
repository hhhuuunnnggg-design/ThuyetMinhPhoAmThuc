import React, { useCallback, useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Image,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { storageService } from "../services/storage";
import { LANGUAGE_LABELS } from "../constants";
import { POI } from "../types";

interface HistoryEntry {
  poiId: number;
  poiName: string;
  audioId: number;
  languageCode: string;
  playedAt: string;
}

type RootStackParamList = {
  HomeTabs: undefined;
  POIDetail: { poi: POI; openedFromQr?: boolean };
  QRScanner: undefined;
  Payment: { poi: POI; amount: number; quantity?: number; unitAmount?: number };
};

const HistoryScreen: React.FC = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const loadHistory = useCallback(async () => {
    const entries = await storageService.getNarrationHistory();
    setHistory(entries as HistoryEntry[]);
  }, []);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadHistory();
    setRefreshing(false);
  }, [loadHistory]);

  const handlePress = (entry: HistoryEntry) => {
    navigation.navigate("POIDetail", {
      poi: {
        id: entry.poiId,
        foodName: entry.poiName,
        audios: { [entry.languageCode]: { audioId: entry.audioId, languageCode: entry.languageCode } },
      } as unknown as POI,
    });
  };

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const renderItem = ({ item }: { item: HistoryEntry }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => handlePress(item)}
      activeOpacity={0.7}
    >
      <View style={styles.cardLeft}>
        <Text style={styles.emoji}>🍜</Text>
      </View>
      <View style={styles.cardInfo}>
        <Text style={styles.poiName} numberOfLines={1}>
          {item.poiName || `POI #${item.poiId}`}
        </Text>
        <View style={styles.cardMeta}>
          <View
            style={[
              styles.langBadge,
              { backgroundColor: langColor(item.languageCode) + "20" },
            ]}
          >
            <Text
              style={[
                styles.langBadgeText,
                { color: langColor(item.languageCode) },
              ]}
            >
              {LANGUAGE_LABELS[item.languageCode] || item.languageCode}
            </Text>
          </View>
          <Text style={styles.dateText}>{formatDate(item.playedAt)}</Text>
        </View>
      </View>
      <Text style={styles.arrow}>›</Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>📜 Lịch sử nghe</Text>
        <Text style={styles.headerSub}>{history.length} bản ghi</Text>
      </View>

      <FlatList
        data={history}
        renderItem={renderItem}
        keyExtractor={(item, i) => `${item.poiId}-${i}`}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={["#ff6b35"]} />
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyEmoji}>📜</Text>
            <Text style={styles.emptyTitle}>Chưa có lịch sử</Text>
            <Text style={styles.emptySub}>
              Khi bạn phát thuyết minh, nó sẽ xuất hiện ở đây
            </Text>
          </View>
        }
      />
    </View>
  );
};

const langColor = (lang: string): string => {
  const map: Record<string, string> = {
    vi: "#ff6b35",
    en: "#3b82f6",
    zh: "#ef4444",
    ja: "#ec4899",
    ko: "#8b5cf6",
    fr: "#10b981",
  };
  return map[lang] || "#888";
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f9fa",
  },
  header: {
    paddingTop: 60,
    paddingHorizontal: 16,
    paddingBottom: 16,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#222",
  },
  headerSub: {
    fontSize: 13,
    color: "#888",
    marginTop: 2,
  },
  list: {
    padding: 12,
    paddingBottom: 100,
  },
  card: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 8,
    elevation: 2,
  },
  cardLeft: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: "#fff3e0",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  emoji: {
    fontSize: 22,
  },
  cardInfo: {
    flex: 1,
  },
  poiName: {
    fontSize: 15,
    fontWeight: "600",
    color: "#222",
    marginBottom: 6,
  },
  cardMeta: {
    flexDirection: "row",
    alignItems: "center",
  },
  langBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    marginRight: 8,
  },
  langBadgeText: {
    fontSize: 11,
    fontWeight: "600",
  },
  dateText: {
    fontSize: 12,
    color: "#aaa",
  },
  arrow: {
    fontSize: 22,
    color: "#ccc",
    marginLeft: 8,
  },
  empty: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 100,
    paddingHorizontal: 40,
  },
  emptyEmoji: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#555",
    marginBottom: 8,
  },
  emptySub: {
    fontSize: 13,
    color: "#999",
    textAlign: "center",
  },
});

export default HistoryScreen;
