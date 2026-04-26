import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from "react-native";
import { RouteProp, useRoute, useNavigation, useFocusEffect } from "@react-navigation/native";
import { Audio } from "expo-av";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import * as Haptics from "expo-haptics";
import api, { getAudioStreamUrl, logNarration, stopCurrentNarration } from "../services/api";
import { unwrapEntityResponse } from "../utils/apiResponse";
import { storageService } from "../services/storage";
import { deviceService } from "../services/device";
import { offlineDbService } from "../services/offlineDb";
import { LANGUAGE_LABELS } from "../constants";
import { resolveMediaUrl } from "../utils/mediaUrl";
import { POI, AudioInfo, DeviceConfig } from "../types";

type RootStackParamList = {
  Home: undefined;
  POIDetail: { poi: POI; fromQrScan?: boolean };
  QRScanner: undefined;
  Payment: { poi: POI; amount: number; quantity?: number; unitAmount?: number };
};

const MAX_ORDER_QTY = 30;

/** Giá POI lưu theo VND đầy đủ (form admin: "Giá (VND)"), không phải đơn vị nghìn. */
function unitPriceVnd(poi: POI): number {
  if (poi.price == null) return 10000;
  const n = Number(poi.price);
  return Number.isFinite(n) && n > 0 ? Math.round(n) : 10000;
}

const POIDetailScreen: React.FC = () => {
  const route = useRoute<RouteProp<RootStackParamList, "POIDetail">>();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { poi: routePoi, fromQrScan } = route.params;

  /** POI đầy đủ audios — list/home/offline thường thiếu map audios, cần bổ sung */
  const [poi, setPoi] = useState<POI>(routePoi);
  const [loadingDetail, setLoadingDetail] = useState(false);

  const [preferredLang, setPreferredLang] = useState<string>("vi");
  const [playingAudioId, setPlayingAudioId] = useState<string | null>(null);
  const [loadingAudio, setLoadingAudio] = useState(false);
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [deviceConfig, setDeviceConfig] = useState<DeviceConfig | null>(null);
  const [orderQty, setOrderQty] = useState(1);
  const audioRef = useRef<Audio.Sound | null>(null);
  const narrLogStartMsRef = useRef<number | null>(null);
  const narrLogAudioIdRef = useRef<number | null>(null);
  /** Đảm bảo auto-play chỉ chạy đúờng một lần khi đến từ QR scanner. */
  const autoPlayDoneRef = useRef(false);

  const loadPreferences = useCallback(async () => {
    const lang = await storageService.getPreferredLanguage();
    setPreferredLang(lang);
  }, []);

  useFocusEffect(
    useCallback(() => {
      void loadPreferences();
    }, [loadPreferences])
  );

  useEffect(() => {
    let cancelled = false;
    const base = routePoi;
    setPoi(base);
    // Reset auto-play khi POI mới được truyền vào
    autoPlayDoneRef.current = false;
    const hasAudios =
      base.audios &&
      typeof base.audios === "object" &&
      Object.keys(base.audios).length > 0;
    if (hasAudios) {
      return;
    }
    setLoadingDetail(true);
    (async () => {
      try {
        const fromSql = await offlineDbService.getAllAudiosForPOI(base.id);
        if (!cancelled && Object.keys(fromSql).length > 0) {
          setPoi({ ...base, audios: fromSql });
          return;
        }
        const res: any = await api.get(`/api/v1/app/pois/${base.id}`);
        const full = unwrapEntityResponse<POI>(res.data);
        if (!cancelled && full && typeof full === "object") {
          setPoi({
            ...base,
            ...full,
            audios:
              full.audios && Object.keys(full.audios).length > 0
                ? full.audios
                : base.audios ?? {},
          });
        }
      } catch (e) {
        console.warn("POIDetail enrich POI failed", e);
      } finally {
        if (!cancelled) setLoadingDetail(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [routePoi]);

  useEffect(() => {
    checkRunningMode();
    const setupAudio = async () => {
      try {
        await Audio.setAudioModeAsync({
          allowsRecordingIOS: false,
          playsInSilentModeIOS: true,
          staysActiveInBackground: false,
          shouldDuckAndroid: true,
          playThroughEarpieceAndroid: false,
        });
      } catch {}
    };
    setupAudio();
    return () => {
      unloadAudio();
    };
  }, []);

  /**
   * Auto-play một lần khi vào từ QR scanner và audios đã được load.
   * Điều kiện: fromQrScan && chưa tự phát && đang không loading && có audio.
   */
  useEffect(() => {
    if (
      !fromQrScan ||
      autoPlayDoneRef.current ||
      loadingDetail ||
      loadingAudio
    ) {
      return;
    }
    const entries = Object.entries(poi.audios || {});
    if (entries.length === 0) return;

    // Chọn audio theo ngôn ngữ ưa thích, fallback về bản đầu tiên
    const target: AudioInfo | undefined =
      entries.find(([lang]) => lang === preferredLang)?.[1] ??
      (entries[0]?.[1] as AudioInfo | undefined);

    if (target && !playingAudioId) {
      autoPlayDoneRef.current = true;
      void playAudio(target);
    }
  }, [fromQrScan, loadingDetail, loadingAudio, poi.audios, preferredLang]);

  const checkRunningMode = async () => {
    try {
      const info = await deviceService.getDeviceInfo();
      const mode = deviceService.determineRunningMode(info);
      setDeviceConfig({ runningMode: mode } as DeviceConfig);
    } catch {}
  };

  const playAudio = useCallback(async (audio: AudioInfo) => {
    try {
      setLoadingAudio(true);
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

      await unloadAudio();

      // Ưu tiên: SQLite → file cũ (storage) → streaming
      let uri = getAudioStreamUrl(poi.groupKey, audio.languageCode);

      if (deviceConfig?.runningMode === "OFFLINE") {
        // 1. Thử lấy từ SQLite (audio đã sync)
        const sqliteAudio = await offlineDbService.getAudioForPOI(poi.id, audio.languageCode);
        if (sqliteAudio?.localPath) {
          uri = sqliteAudio.localPath;
        } else {
          // 2. Thử lấy từ file cũ (legacy)
          const legacyPath = await storageService.getLocalAudioPath(poi.id, audio.languageCode);
          if (legacyPath) {
            uri = legacyPath;
          } else {
            // 3. Không có local → streaming (vẫn phát được)
            uri = getAudioStreamUrl(poi.groupKey, audio.languageCode);
          }
        }
      }

      const { sound: newSound } = await Audio.Sound.createAsync({ uri });
      audioRef.current = newSound;
      setSound(newSound);
      setPlayingAudioId(audio.languageCode);

      await newSound.playAsync();

      const t0 = Date.now();
      narrLogStartMsRef.current = t0;
      narrLogAudioIdRef.current = audio.audioId;

      // Notify backend (chỉ khi online)
      try {
        const deviceId = await deviceService.getDeviceId();
        await api.post("/api/v1/app/narration/start", {
          deviceId,
          poiId: poi.id,
          audioId: audio.audioId,
          languageCode: audio.languageCode,
        });
      } catch {}

      newSound.setOnPlaybackStatusUpdate((status) => {
        if (status.isLoaded && status.didJustFinish) {
          const startMs = narrLogStartMsRef.current;
          const aid = narrLogAudioIdRef.current;
          narrLogStartMsRef.current = null;
          narrLogAudioIdRef.current = null;
          let durSec: number | undefined;
          if (typeof status.durationMillis === "number") {
            durSec = Math.round(status.durationMillis / 1000);
          } else if (startMs != null) {
            durSec = Math.round((Date.now() - startMs) / 1000);
          }
          if (startMs != null && aid != null) {
            void (async () => {
              try {
                const deviceId = await deviceService.getDeviceId();
                await logNarration({
                  deviceId,
                  ttsAudioId: aid,
                  playedAt: startMs,
                  durationSeconds: durSec,
                  status: "COMPLETED",
                });
              } catch {
                /* ignore */
              }
            })();
          }
          void stopCurrentNarration("COMPLETED").catch(() => {});
          setPlayingAudioId(null);
          void handleAudioEnd(audio);
        }
      });
    } catch (error: any) {
      Alert.alert("Lỗi", "Không thể phát audio: " + (error?.message || "Lỗi không xác định"));
    } finally {
      setLoadingAudio(false);
    }
  }, [poi, deviceConfig]);

  const handleAudioEnd = async (audio: AudioInfo) => {
    await storageService.addToNarrationHistory({
      poiId: poi.id,
      poiName: poi.foodName,
      audioId: audio.audioId,
      languageCode: audio.languageCode,
    });
  };

  const unloadAudio = async () => {
    const startMs = narrLogStartMsRef.current;
    const aid = narrLogAudioIdRef.current;
    narrLogStartMsRef.current = null;
    narrLogAudioIdRef.current = null;
    
    try {
      await stopCurrentNarration("SKIPPED");
    } catch {
      /* ignore */
    }

    if (startMs != null && aid != null) {
      try {
        const deviceId = await deviceService.getDeviceId();
        await logNarration({
          deviceId,
          ttsAudioId: aid,
          playedAt: startMs,
          durationSeconds: Math.round((Date.now() - startMs) / 1000),
          status: "SKIPPED",
        });
      } catch {
        /* ignore */
      }
    }
    if (audioRef.current) {
      try {
        await audioRef.current.unloadAsync();
      } catch {}
      audioRef.current = null;
      setSound(null);
    }
    setPlayingAudioId(null);
  };

  const handlePause = async () => {
    if (sound) {
      const status = await sound.getStatusAsync();
      if (status.isLoaded) {
        if (status.isPlaying) {
          await sound.pauseAsync();
        } else {
          await sound.playAsync();
        }
      }
    }
  };

  const handleStop = async () => {
    await unloadAudio();
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const handlePayment = () => {
    const unit = unitPriceVnd(poi);
    const amount = unit * orderQty;
    navigation.navigate("Payment", { poi, amount, quantity: orderQty, unitAmount: unit });
  };

  const bumpQty = (delta: number) => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setOrderQty((q) => Math.min(MAX_ORDER_QTY, Math.max(1, q + delta)));
  };

  const unitVnd = unitPriceVnd(poi);
  const totalVnd = unitVnd * orderQty;

  const audioEntries = Object.entries(poi.audios || {});
  /** Đang phát: theo track hiện tại; không phát: ưu tiên ngôn ngữ trong Cài đặt, không có thì bản đầu tiên. */
  const playbackAudio: AudioInfo | undefined = playingAudioId
    ? audioEntries.find(([lang]) => lang === playingAudioId)?.[1]
    : audioEntries.find(([lang]) => lang === preferredLang)?.[1] ?? audioEntries[0]?.[1];

  return (
    <ScrollView style={styles.container}>
      {/* Header Image */}
      {resolveMediaUrl(poi.imageUrl) ? (
        <Image
          source={{ uri: resolveMediaUrl(poi.imageUrl)! }}
          style={styles.headerImage}
          resizeMode="cover"
        />
      ) : (
        <View style={[styles.headerImage, styles.headerImagePlaceholder]}>
          <Text style={styles.headerImagePlaceholderText}>🍜</Text>
        </View>
      )}

      {/* POI Info */}
      <View style={styles.infoSection}>
        <Text style={styles.foodName}>{poi.foodName || "POI #" + poi.id}</Text>

        {poi.price != null && (
          <Text style={styles.price}>
            {Number(poi.price).toLocaleString("vi-VN")}đ
            <Text style={styles.priceUnit}> / suất</Text>
          </Text>
        )}

        {poi.address && (
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>📍 Địa chỉ</Text>
            <Text style={styles.infoValue}>{poi.address}</Text>
          </View>
        )}

        {poi.openHours && (
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>🕐 Giờ mở cửa</Text>
            <Text style={styles.infoValue}>{poi.openHours}</Text>
          </View>
        )}

        {poi.phone && (
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>📞 Liên hệ</Text>
            <Text style={styles.infoValue}>{poi.phone}</Text>
          </View>
        )}

        {poi.description && (
          <View style={styles.descriptionSection}>
            <Text style={styles.sectionTitle}>Giới thiệu</Text>
            <Text style={styles.description}>{poi.description}</Text>
          </View>
        )}
      </View>

      {/* Thuyết minh — luôn hiện khối; list trước đó thường thiếu audios (offline SQLite mapRowToPOI) */}
      <View style={styles.playerSection}>
        {loadingDetail ? (
          <ActivityIndicator size="small" color="#ff6b35" />
        ) : loadingAudio ? (
          <ActivityIndicator size="large" color="#ff6b35" />
        ) : audioEntries.length === 0 ? (
          <View style={styles.noAudioBox}>
            <Text style={styles.playerSectionLabel}>Thuyết minh</Text>
            <Text style={styles.noAudioText}>
              Chưa có bản ghi audio cho địa điểm này. Kiểm tra đã tạo nhóm TTS trên admin hoặc đồng bộ offline.
            </Text>
          </View>
        ) : (
          <View style={styles.playerControls}>
            {playbackAudio ? (
              <View style={styles.currentAudioInfo}>
                <Text style={styles.playerSectionLabel}>Thuyết minh</Text>
                <Text style={styles.currentAudioLang}>
                  {LANGUAGE_LABELS[playbackAudio.languageCode] || playbackAudio.languageCode}
                </Text>
                {playbackAudio.fileSize ? (
                  <Text style={styles.currentAudioSize}>
                    {(playbackAudio.fileSize / (1024 * 1024)).toFixed(1)} MB
                  </Text>
                ) : null}
              </View>
            ) : null}

            <View style={styles.controlButtons}>
              {playbackAudio ? (
                <>
                  <TouchableOpacity
                    style={styles.playButton}
                    onPress={() => playAudio(playbackAudio)}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.playButtonText}>
                      {playingAudioId ? "🔊 Đang phát..." : "▶ Phát"}
                    </Text>
                  </TouchableOpacity>

                  {playingAudioId ? (
                    <TouchableOpacity
                      style={styles.stopButton}
                      onPress={handleStop}
                      activeOpacity={0.8}
                    >
                      <Text style={styles.stopButtonText}>⏹ Dừng</Text>
                    </TouchableOpacity>
                  ) : null}
                </>
              ) : null}
            </View>
          </View>
        )}
      </View>

      {/* Số suất + thanh toán */}
      <View style={styles.paymentBlock}>
        <Text style={styles.paymentBlockTitle}>Thanh toán</Text>
        <View style={styles.qtyRow}>
          <Text style={styles.qtyLabel}>Số suất</Text>
          <View style={styles.qtyStepper}>
            <TouchableOpacity
              style={[styles.qtyBtn, orderQty <= 1 && styles.qtyBtnDisabled]}
              onPress={() => bumpQty(-1)}
              disabled={orderQty <= 1}
              activeOpacity={0.7}
            >
              <Text style={styles.qtyBtnText}>−</Text>
            </TouchableOpacity>
            <Text style={styles.qtyValue}>{orderQty}</Text>
            <TouchableOpacity
              style={[styles.qtyBtn, orderQty >= MAX_ORDER_QTY && styles.qtyBtnDisabled]}
              onPress={() => bumpQty(1)}
              disabled={orderQty >= MAX_ORDER_QTY}
              activeOpacity={0.7}
            >
              <Text style={styles.qtyBtnText}>+</Text>
            </TouchableOpacity>
          </View>
        </View>
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Tạm tính</Text>
          <Text style={styles.totalAmount}>{totalVnd.toLocaleString("vi-VN")} ₫</Text>
        </View>
        <TouchableOpacity style={styles.payButton} onPress={handlePayment} activeOpacity={0.85}>
          <Text style={styles.payButtonText}>💳 Thanh toán PayOS</Text>
          <Text style={styles.payButtonSub}>
            {orderQty > 1
              ? `${orderQty} suất × ${unitVnd.toLocaleString("vi-VN")} ₫`
              : "Quét QR VietQR hoặc mở link PayOS"}
          </Text>
        </TouchableOpacity>
      </View>

      <View style={{ height: 60 }} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  headerImage: {
    width: "100%",
    height: 280,
  },
  headerImagePlaceholder: {
    backgroundColor: "#f5f5f5",
    alignItems: "center",
    justifyContent: "center",
  },
  headerImagePlaceholderText: {
    fontSize: 80,
  },
  infoSection: {
    padding: 20,
  },
  foodName: {
    fontSize: 26,
    fontWeight: "bold",
    color: "#222",
  },
  price: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#ff6b35",
    marginTop: 4,
  },
  priceUnit: {
    fontSize: 15,
    fontWeight: "600",
    color: "#b85a2a",
  },
  infoRow: {
    flexDirection: "row",
    marginTop: 14,
    alignItems: "flex-start",
  },
  infoLabel: {
    fontSize: 14,
    color: "#888",
    minWidth: 118,
    marginRight: 12,
    paddingTop: 1,
  },
  infoValue: {
    fontSize: 14,
    color: "#444",
    flex: 1,
    lineHeight: 20,
  },
  descriptionSection: {
    marginTop: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 10,
  },
  description: {
    fontSize: 16,
    color: "#444",
    lineHeight: 26,
  },
  playerSection: {
    padding: 20,
    alignItems: "center",
    borderTopWidth: 1,
    borderTopColor: "#eee",
  },
  noAudioBox: {
    width: "100%",
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  noAudioText: {
    fontSize: 14,
    color: "#888",
    lineHeight: 22,
    textAlign: "center",
    marginTop: 6,
  },
  playerControls: {
    width: "100%",
    alignItems: "center",
  },
  currentAudioInfo: {
    alignItems: "center",
    marginBottom: 16,
  },
  playerSectionLabel: {
    fontSize: 13,
    color: "#888",
    marginBottom: 4,
    fontWeight: "500",
  },
  currentAudioLang: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
  },
  currentAudioSize: {
    fontSize: 12,
    color: "#888",
    marginTop: 4,
  },
  controlButtons: {
    flexDirection: "row",
    gap: 12,
  },
  playButton: {
    backgroundColor: "#ff6b35",
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 30,
  },
  playButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  stopButton: {
    backgroundColor: "#f5f5f5",
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 30,
    borderWidth: 1,
    borderColor: "#ddd",
  },
  stopButtonText: {
    color: "#555",
    fontSize: 15,
    fontWeight: "600",
  },
  paymentBlock: {
    marginHorizontal: 20,
    marginTop: 8,
    padding: 18,
    backgroundColor: "#fafafa",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#eee",
  },
  paymentBlockTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#333",
    marginBottom: 14,
  },
  qtyRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 14,
  },
  qtyLabel: {
    fontSize: 15,
    color: "#555",
    fontWeight: "500",
  },
  qtyStepper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e5e5e5",
    overflow: "hidden",
  },
  qtyBtn: {
    width: 48,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fff",
  },
  qtyBtnDisabled: {
    opacity: 0.35,
  },
  qtyBtnText: {
    fontSize: 22,
    fontWeight: "600",
    color: "#ff6b35",
    lineHeight: 24,
  },
  qtyValue: {
    minWidth: 40,
    textAlign: "center",
    fontSize: 18,
    fontWeight: "700",
    color: "#222",
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 4,
    paddingBottom: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#ddd",
    marginBottom: 16,
  },
  totalLabel: {
    fontSize: 14,
    color: "#666",
  },
  totalAmount: {
    fontSize: 20,
    fontWeight: "800",
    color: "#ff6b35",
  },
  payButton: {
    backgroundColor: "#ff6b35",
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: "center",
    shadowColor: "#ff6b35",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  payButtonText: {
    color: "#fff",
    fontSize: 17,
    fontWeight: "700",
  },
  payButtonSub: {
    color: "rgba(255,255,255,0.92)",
    fontSize: 12,
    marginTop: 6,
    textAlign: "center",
    paddingHorizontal: 8,
  },
});

export default POIDetailScreen;
