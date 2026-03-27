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
import { RouteProp, useRoute, useNavigation } from "@react-navigation/native";
import { Audio } from "expo-av";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import * as Haptics from "expo-haptics";
import api, { getAudioStreamUrl, logNarration } from "../services/api";
import { storageService } from "../services/storage";
import { deviceService } from "../services/device";
import { offlineDbService } from "../services/offlineDb";
import { APP_CONFIG, LANGUAGE_LABELS, LANGUAGE_COLORS } from "../constants";
import { resolveMediaUrl } from "../utils/mediaUrl";
import { POI, AudioInfo, DeviceConfig } from "../types";

type RootStackParamList = {
  Home: undefined;
  POIDetail: { poi: POI };
  QRScanner: undefined;
  Payment: { poi: POI; amount: number };
};

const POIDetailScreen: React.FC = () => {
  const route = useRoute<RouteProp<RootStackParamList, "POIDetail">>();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { poi } = route.params;

  const [preferredLang, setPreferredLang] = useState<string>("vi");
  const [playingAudioId, setPlayingAudioId] = useState<string | null>(null);
  const [loadingAudio, setLoadingAudio] = useState(false);
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [deviceConfig, setDeviceConfig] = useState<DeviceConfig | null>(null);
  const [isInRange, setIsInRange] = useState(false);
  const audioRef = useRef<Audio.Sound | null>(null);
  const narrLogStartMsRef = useRef<number | null>(null);
  const narrLogAudioIdRef = useRef<number | null>(null);

  useEffect(() => {
    loadPreferences();
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

  const loadPreferences = async () => {
    const lang = await storageService.getPreferredLanguage();
    setPreferredLang(lang);
  };

  const checkRunningMode = async () => {
    try {
      const info = await deviceService.getDeviceInfo();
      const mode = deviceService.determineRunningMode(info);
      setDeviceConfig({ runningMode: mode } as DeviceConfig);
    } catch {}
  };

  const handleLangChange = async (lang: string) => {
    setPreferredLang(lang);
    await storageService.setPreferredLanguage(lang);
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
    navigation.navigate("Payment", { poi, amount: poi.price ? Number(poi.price) * 1000 : 10000 });
  };

  const audioEntries = Object.entries(poi.audios || {});
  const currentAudio = audioEntries.find(([lang]) => lang === playingAudioId)?.[1];

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

        {poi.price && (
          <Text style={styles.price}>
            {Number(poi.price).toLocaleString("vi-VN")}đ
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

      {/* Language Selector */}
      {audioEntries.length > 0 && (
        <View style={styles.langSection}>
          <Text style={styles.sectionTitle}>Chọn ngôn ngữ</Text>
          <View style={styles.langButtons}>
            {audioEntries.map(([lang, audio]) => (
              <TouchableOpacity
                key={lang}
                style={[
                  styles.langButton,
                  preferredLang === lang && styles.langButtonActive,
                  playingAudioId === lang && styles.langButtonPlaying,
                ]}
                onPress={() => handleLangChange(lang)}
                activeOpacity={0.7}
              >
                <View
                  style={[
                    styles.langDot,
                    { backgroundColor: LANGUAGE_COLORS[lang] || "#888" },
                  ]}
                />
                <Text
                  style={[
                    styles.langButtonText,
                    preferredLang === lang && styles.langButtonTextActive,
                  ]}
                >
                  {LANGUAGE_LABELS[lang] || lang.toUpperCase()}
                </Text>
                {playingAudioId === lang && (
                  <Text style={styles.playingIndicator}>🔊</Text>
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}

      {/* Player Controls */}
      {audioEntries.length > 0 && (
        <View style={styles.playerSection}>
          {loadingAudio ? (
            <ActivityIndicator size="large" color="#ff6b35" />
          ) : (
            <View style={styles.playerControls}>
              {currentAudio ? (
                <View style={styles.currentAudioInfo}>
                  <Text style={styles.currentAudioLang}>
                    {LANGUAGE_LABELS[currentAudio.languageCode] || currentAudio.languageCode}
                  </Text>
                  {currentAudio.fileSize && (
                    <Text style={styles.currentAudioSize}>
                      {(currentAudio.fileSize / (1024 * 1024)).toFixed(1)} MB
                    </Text>
                  )}
                </View>
              ) : (
                <Text style={styles.selectLangText}>Chọn ngôn ngữ để phát</Text>
              )}

              <View style={styles.controlButtons}>
                {currentAudio && (
                  <>
                    <TouchableOpacity
                      style={styles.playButton}
                      onPress={() => playAudio(currentAudio)}
                      activeOpacity={0.8}
                    >
                      <Text style={styles.playButtonText}>
                        {playingAudioId ? "🔊 Đang phát..." : "▶ Phát"}
                      </Text>
                    </TouchableOpacity>

                    {playingAudioId && (
                      <TouchableOpacity
                        style={styles.stopButton}
                        onPress={handleStop}
                        activeOpacity={0.8}
                      >
                        <Text style={styles.stopButtonText}>⏹ Dừng</Text>
                      </TouchableOpacity>
                    )}
                  </>
                )}
              </View>
            </View>
          )}
        </View>
      )}

      {/* Payment Button */}
      <TouchableOpacity style={styles.payButton} onPress={handlePayment} activeOpacity={0.8}>
        <Text style={styles.payButtonText}>💳 Ủng hộ / Thanh toán</Text>
      </TouchableOpacity>

      {/* QR định danh POI (quét để mở địa điểm) — khác với QR VietQR PayOS ở màn Thanh toán */}
      {poi.qrCode && (
        <View style={styles.qrSection}>
          <Text style={styles.sectionTitle}>Mã QR địa điểm</Text>
          <Text style={styles.qrHint}>Dùng để quét / mở POI — không phải mã thanh toán ngân hàng.</Text>
          <View style={styles.qrPlaceholder}>
            <Text style={styles.qrText}>ID: {poi.qrCode.substring(0, 8)}…</Text>
          </View>
        </View>
      )}

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
  infoRow: {
    flexDirection: "row",
    marginTop: 12,
  },
  infoLabel: {
    fontSize: 14,
    color: "#888",
    width: 100,
  },
  infoValue: {
    fontSize: 14,
    color: "#444",
    flex: 1,
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
    fontSize: 15,
    color: "#555",
    lineHeight: 24,
  },
  langSection: {
    padding: 20,
    backgroundColor: "#f8f9fa",
  },
  langButtons: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  langButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: "#fff",
    borderWidth: 2,
    borderColor: "#e0e0e0",
  },
  langButtonActive: {
    borderColor: "#ff6b35",
    backgroundColor: "#fff3e0",
  },
  langButtonPlaying: {
    borderColor: "#22c55e",
    backgroundColor: "#e8f5e9",
  },
  langDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 6,
  },
  langButtonText: {
    fontSize: 13,
    color: "#555",
  },
  langButtonTextActive: {
    color: "#ff6b35",
    fontWeight: "600",
  },
  playingIndicator: {
    marginLeft: 6,
    fontSize: 14,
  },
  playerSection: {
    padding: 20,
    alignItems: "center",
    borderTopWidth: 1,
    borderTopColor: "#eee",
  },
  playerControls: {
    width: "100%",
    alignItems: "center",
  },
  currentAudioInfo: {
    alignItems: "center",
    marginBottom: 16,
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
  selectLangText: {
    fontSize: 14,
    color: "#999",
    marginBottom: 16,
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
  payButton: {
    marginHorizontal: 20,
    marginTop: 10,
    backgroundColor: "#e3f2fd",
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
  },
  payButtonText: {
    color: "#1976d2",
    fontSize: 16,
    fontWeight: "600",
  },
  qrSection: {
    padding: 20,
    alignItems: "center",
  },
  qrHint: {
    fontSize: 12,
    color: "#888",
    textAlign: "center",
    marginBottom: 10,
    paddingHorizontal: 8,
  },
  qrPlaceholder: {
    padding: 20,
    backgroundColor: "#f5f5f5",
    borderRadius: 12,
  },
  qrText: {
    fontSize: 12,
    color: "#999",
    fontFamily: "monospace",
  },
});

export default POIDetailScreen;
