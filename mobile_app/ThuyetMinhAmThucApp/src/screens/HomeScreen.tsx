import React, { useCallback, useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Image,
} from "react-native";
import * as Location from "expo-location";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import api from "../services/api";
import { unwrapListResponse } from "../utils/apiResponse";
import { resolveMediaUrl } from "../utils/mediaUrl";
import { deviceService } from "../services/device";
import { storageService } from "../services/storage";
import { offlineDbService } from "../services/offlineDb";
import { offlineSyncService } from "../services/offlineSync";
import { APP_CONFIG } from "../constants";
import { POI, NearbyPOI, DeviceConfig } from "../types";
import { haversineDistance, formatDistance } from "../utils/geo";

type RootStackParamList = {
  Home: undefined;
  POIDetail: { poi: POI; openedFromQr?: boolean };
  QRScanner: undefined;
};

function sortPoisByDistanceFromUser(
  list: NearbyPOI[],
  userLat: number | undefined,
  userLng: number | undefined
): NearbyPOI[] {
  if (
    userLat == null ||
    userLng == null ||
    Number.isNaN(userLat) ||
    Number.isNaN(userLng)
  ) {
    return [...list];
  }

  const enriched = list.map((p) => {
    const plat = p.latitude;
    const plng = p.longitude;
    if (plat == null || plng == null || Number.isNaN(plat) || Number.isNaN(plng)) {
      return { ...p, distanceMeters: null };
    }
    const d = haversineDistance(userLat, userLng, plat, plng);
    return { ...p, distanceMeters: d };
  });

  enriched.sort((a, b) => {
    const da = a.distanceMeters;
    const db = b.distanceMeters;
    if (da == null && db == null) return 0;
    if (da == null) return 1;
    if (db == null) return -1;
    return da - db;
  });

  return enriched;
}

/**
 * Màu khoảng cách theo nhiệt độ:
 *   < 100m   → xanh đậm  (đang trong tầm kích hoạt)
 *   100–500m → xanh      (rất gần)
 *   500–1km  → cam       (khá gần)
 *   1–2km    → đỏ-cam   (xa)
 *   > 2km    → đỏ       (rất xa)
 */
function getDistanceColor(meters: number): string {
  if (meters < 100) return "#2e7d32";
  if (meters < 500) return "#388e3c";
  if (meters < 1000) return "#f57c00";
  if (meters < 2000) return "#e53935";
  return "#b71c1c";
}

const HomeScreen: React.FC = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [pois, setPois] = useState<NearbyPOI[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [deviceConfig, setDeviceConfig] = useState<DeviceConfig | null>(null);
  const [deviceLocation, setDeviceLocation] = useState<Location.LocationObject | null>(null);
  const [runningMode, setRunningMode] = useState<"OFFLINE" | "STREAMING">("STREAMING");
  const [poiSource, setPoiSource] = useState<"server" | "cache">("server");

  const loadPOIs = useCallback(async (lat?: number, lng?: number) => {
    try {
      const offlineEnabled = await storageService.isOfflineModeEnabled();
      const offlineCapable = await deviceService.isCapableOfOffline();
      const useOfflineSqlite = offlineEnabled && offlineCapable;
      let nearbyPois: NearbyPOI[] = [];

      if (useOfflineSqlite) {
        // Ưu tiên SQLite, fallback server (chỉ khi thiết bị đủ điều kiện offline)
        const cachedPOIs = await offlineDbService.getAllPOIs();
        if (cachedPOIs.length > 0) {
          nearbyPois = cachedPOIs as NearbyPOI[];
          setPoiSource("cache");
        } else {
          // Cache rỗng → gọi server + sync
          const res: any = await api.get("/api/v1/app/pois");
          nearbyPois = unwrapListResponse<NearbyPOI>(res.data);
          setPoiSource("server");
          // Background sync
          const preferredLang = await storageService.getPreferredLanguage();
          offlineSyncService.deltaSync(preferredLang);
        }
      } else {
        // Online mode — luôn gọi server
        if (lat != null && lng != null) {
          const res: any = await api.get(
            `/api/v1/app/pois/nearby?lat=${lat}&lng=${lng}&radiusKm=${APP_CONFIG.NEARBY_RADIUS_KM}`
          );
          nearbyPois = unwrapListResponse<NearbyPOI>(res.data);
        } else {
          const res: any = await api.get("/api/v1/app/pois");
          nearbyPois = unwrapListResponse<NearbyPOI>(res.data);
        }
        setPoiSource("server");
      }

      setPois(sortPoisByDistanceFromUser(nearbyPois, lat, lng));
    } catch (error) {
      // API lỗi → chỉ fallback SQLite nếu bật offline và thiết bị đủ điều kiện
      console.error("Load POIs error:", error);
      try {
        const offlineEnabled = await storageService.isOfflineModeEnabled();
        const offlineCapable = await deviceService.isCapableOfOffline();
        if (!(offlineEnabled && offlineCapable)) return;
        const cachedPOIs = await offlineDbService.getAllPOIs();
        if (cachedPOIs.length > 0) {
          setPois(sortPoisByDistanceFromUser(cachedPOIs as NearbyPOI[], lat, lng));
          setPoiSource("cache");
        }
      } catch {}
    }
  }, []);

  const checkDeviceConfig = useCallback(async () => {
    try {
      const info = await deviceService.getDeviceInfo();
      const mode = deviceService.determineRunningMode(info);
      setRunningMode(mode);

      const config: any = {
        runningMode: mode,
        deviceId: info.deviceId,
      };
      setDeviceConfig(config);
    } catch (error) {
      console.error("Device config error:", error);
    }
  }, []);

  const initLocation = useCallback(async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") return;

      const location = await Location.getCurrentPositionAsync({});
      setDeviceLocation(location);
      await loadPOIs(location.coords.latitude, location.coords.longitude);
    } catch (error) {
      console.error("Location error:", error);
      await loadPOIs();
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [loadPOIs]);

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      await checkDeviceConfig();
      await initLocation();
    };
    init();
  }, [checkDeviceConfig, initLocation]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await checkDeviceConfig();
    await initLocation();
  }, [checkDeviceConfig, initLocation]);

  const handlePOIPress = (poi: NearbyPOI) => {
    navigation.navigate("POIDetail", { poi: poi as unknown as POI });
  };

  const renderPOIItem = ({ item }: { item: NearbyPOI }) => (
    <TouchableOpacity
      style={styles.poiCard}
      onPress={() => handlePOIPress(item)}
      activeOpacity={0.7}
    >
      {resolveMediaUrl(item.imageUrl) ? (
        <Image
          source={{ uri: resolveMediaUrl(item.imageUrl)! }}
          style={styles.poiImage}
          resizeMode="cover"
        />
      ) : (
        <View style={[styles.poiImage, styles.poiImagePlaceholder]}>
          <Text style={styles.poiImagePlaceholderText}>🍜</Text>
        </View>
      )}

      <View style={styles.poiInfo}>
        <Text style={styles.poiName} numberOfLines={1}>
          {item.foodName || "POI #" + item.id}
        </Text>
        {item.distanceMeters != null && Number.isFinite(item.distanceMeters) ? (
          <Text
            style={[styles.poiDistance, { color: getDistanceColor(item.distanceMeters) }]}
            numberOfLines={1}
          >
            📍 {formatDistance(item.distanceMeters)} từ bạn
          </Text>
        ) : item.address ? (
          <Text style={styles.poiAddress} numberOfLines={1}>
            📍 {item.address}
          </Text>
        ) : null}
        {item.category && (
          <View style={styles.categoryBadge}>
            <Text style={styles.categoryText}>{item.category}</Text>
          </View>
        )}
      </View>

      <View style={styles.poiRight}>
        {item.activeListenerCount > 0 && (
          <View style={styles.liveBadge}>
            <Text style={styles.liveBadgeText}>🔊 {item.activeListenerCount}</Text>
          </View>
        )}
        {item.downloadedOffline && (
          <Text style={styles.offlineBadge}>📥</Text>
        )}
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Phố Ẩm Thực</Text>
          <Text style={styles.headerSubtitle}>
            {pois.length} địa điểm nearby
          </Text>
        </View>
        <View style={styles.headerRight}>
          <View style={[styles.modeBadge, runningMode === "OFFLINE" && styles.modeBadgeOffline]}>
            <Text style={[styles.modeBadgeText, runningMode === "OFFLINE" && styles.modeBadgeTextOffline]}>
              {runningMode === "OFFLINE"
                ? poiSource === "cache"
                  ? "📥 Offline (cache)"
                  : "📥 Offline"
                : "📡 Online"}
            </Text>
          </View>
          <Text style={styles.wifiHint}>
            {runningMode === "OFFLINE" ? "Không cần wifi" : "Cần sử dụng wifi"}
          </Text>
          {deviceConfig?.runningMode === "OFFLINE" && poiSource === "cache" && (
            <Text style={styles.cacheHint}>Dữ liệu từ SQLite</Text>
          )}
        </View>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#ff6b35" />
          <Text style={styles.loadingText}>Đang tải địa điểm...</Text>
        </View>
      ) : (
        <FlatList
          data={pois}
          renderItem={renderPOIItem}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={["#ff6b35"]} />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyEmoji}>🍽️</Text>
              <Text style={styles.emptyText}>Không có địa điểm nào nearby</Text>
              <Text style={styles.emptySubtext}>Thử di chuyển đến khu vực có phố ẩm thực</Text>
            </View>
          }
        />
      )}

      {/* QR Scan Button */}
      <TouchableOpacity
        style={styles.qrButton}
        onPress={() => navigation.navigate("QRScanner")}
        activeOpacity={0.8}
      >
        <Text style={styles.qrButtonText}>📷 Quét QR</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f9fa",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 60,
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
  headerSubtitle: {
    fontSize: 13,
    color: "#888",
    marginTop: 2,
  },
  headerRight: {
    alignItems: "flex-end",
  },
  wifiHint: {
    fontSize: 10,
    color: "#666",
    marginTop: 4,
    textAlign: "right",
  },
  cacheHint: {
    fontSize: 10,
    color: "#888",
    marginTop: 4,
  },
  modeBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: "#e3f2fd",
  },
  modeBadgeOffline: {
    backgroundColor: "#e8f5e9",
  },
  modeBadgeText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#1976d2",
  },
  modeBadgeTextOffline: {
    color: "#388e3c",
  },
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: "#888",
  },
  listContent: {
    padding: 12,
    paddingBottom: 100,
  },
  poiCard: {
    flexDirection: "row",
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 8,
    elevation: 2,
  },
  poiImage: {
    width: 70,
    height: 70,
    borderRadius: 10,
  },
  poiImagePlaceholder: {
    backgroundColor: "#f5f5f5",
    alignItems: "center",
    justifyContent: "center",
  },
  poiImagePlaceholderText: {
    fontSize: 28,
  },
  poiInfo: {
    flex: 1,
    marginLeft: 12,
    justifyContent: "center",
  },
  poiName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#222",
  },
  poiAddress: {
    fontSize: 12,
    color: "#888",
    marginTop: 4,
  },
  poiDistance: {
    fontSize: 12,
    color: "#ff6b35",
    fontWeight: "600",
    marginTop: 4,
  },
  categoryBadge: {
    marginTop: 6,
    alignSelf: "flex-start",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    backgroundColor: "#fff3e0",
  },
  categoryText: {
    fontSize: 11,
    color: "#e65100",
  },
  poiRight: {
    alignItems: "flex-end",
    justifyContent: "center",
  },
  liveBadge: {
    marginTop: 6,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    backgroundColor: "#e8f5e9",
  },
  liveBadgeText: {
    fontSize: 11,
    color: "#388e3c",
    fontWeight: "600",
  },
  offlineBadge: {
    marginTop: 4,
    fontSize: 14,
  },
  emptyContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 100,
  },
  emptyEmoji: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#555",
  },
  emptySubtext: {
    fontSize: 13,
    color: "#999",
    marginTop: 6,
    textAlign: "center",
  },
  qrButton: {
    position: "absolute",
    bottom: 30,
    right: 20,
    backgroundColor: "#ff6b35",
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 30,
    shadowColor: "#ff6b35",
    shadowOpacity: 0.4,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 12,
    elevation: 6,
  },
  qrButtonText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "bold",
  },
});

export default HomeScreen;
