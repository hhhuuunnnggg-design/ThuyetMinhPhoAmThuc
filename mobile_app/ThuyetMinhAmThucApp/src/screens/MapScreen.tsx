import React, { useCallback, useEffect, useMemo, useRef, useState, createElement } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
  Platform,
  SafeAreaView,
  Alert,
} from "react-native";
import Slider from "@react-native-community/slider";
import { WebView, WebViewMessageEvent } from "react-native-webview";
import { Audio } from "expo-av";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import * as Haptics from "expo-haptics";
import api, { getAudioStreamUrl } from "../services/api";
import { deviceService } from "../services/device";
import { storageService } from "../services/storage";
import { useGeofence } from "../hooks/useGeofence";
import { LANGUAGE_LABELS, LANGUAGE_COLORS } from "../constants";
import { NearbyPOI, ActiveNarration, POI } from "../types";
import { formatDistance, haversineDistance } from "../utils/geo";
import { unwrapEntityResponse, unwrapListResponse } from "../utils/apiResponse";
import { POIGeofence } from "../utils/geoEngine";

const { height: SCREEN_H } = Dimensions.get("window");

function pickAudioInfo(poi: NearbyPOI, lang: string): { lang: string; info: any } | null {
  const audios = poi.audios as Record<string, any> | undefined;
  if (!audios || typeof audios !== "object") return null;
  const keys = Object.keys(audios);
  if (keys.length === 0) return null;
  if (audios[lang]) return { lang, info: audios[lang] };
  if (audios.vi) return { lang: "vi", info: audios.vi };
  const k = keys[0];
  return { lang: k, info: audios[k] };
}

/** Bản đồ dùng list/nearby có thể thiếu audios — bổ sung từ GET /pois/:id (cùng buildPOIDTO với web). */
async function fetchPOIWithAudios(poi: NearbyPOI): Promise<NearbyPOI> {
  try {
    const res = await api.get(`/api/v1/app/pois/${poi.id}`);
    const full = unwrapEntityResponse<POI>(res.data) ?? (res.data as POI | null);
    if (
      full?.groupKey &&
      full.audios &&
      typeof full.audios === "object" &&
      Object.keys(full.audios).length > 0
    ) {
      return {
        ...poi,
        ...full,
        distanceMeters: poi.distanceMeters,
        activeListenerCount: poi.activeListenerCount ?? 0,
        downloadedOffline: poi.downloadedOffline ?? false,
      };
    }
  } catch (e) {
    console.warn("fetchPOIWithAudios failed", e);
  }
  return poi;
}

type RootStackParamList = {
  HomeTabs: undefined;
  POIDetail: { poi: POI };
  QRScanner: undefined;
  Payment: { poi: POI; amount: number };
};

interface MapScreenProps {
  pois: NearbyPOI[];
  loading: boolean;
  preferredLang: string;
  onPreferredLangChange: (lang: string) => void;
}

// ============ Mock Slider (native, smooth like web) ============
/**
 * State kéo giữ trong component này, chỉ gọi onSlidingComplete khi thả tay.
 * Tránh "Maximum update depth exceeded": Slider điều khiển bằng value từ parent +
 * setState trong onValueChange → re-render → Slider lại bắn onValueChange → vòng lặp vô hạn.
 */
const MockSlider: React.FC<{
  min: number;
  max: number;
  value: number;
  /** Gọi mỗi bước kéo — chỉ dùng cho preview bản đồ (không setState parent). */
  onValueChange?: (v: number) => void;
  /** Gọi một lần khi thả tay — cập nhật mockLat/mockLng ở parent. */
  onSlidingComplete: (v: number) => void;
}> = ({ min, max, value, onValueChange, onSlidingComplete }) => {
  const [internal, setInternal] = useState(value);
  useEffect(() => {
    setInternal(value);
  }, [value]);

  return (
    <View style={sliderStyles.trackWrap}>
      <Slider
        style={sliderStyles.slider}
        minimumValue={min}
        maximumValue={max}
        step={(max - min) / 200}
        value={internal}
        onValueChange={(v) => {
          setInternal(v);
          onValueChange?.(v);
        }}
        onSlidingComplete={onSlidingComplete}
        minimumTrackTintColor="#ff6b35"
        maximumTrackTintColor="#e0e0e0"
        thumbTintColor="#ff6b35"
      />
    </View>
  );
};

const sliderStyles = StyleSheet.create({
  trackWrap: {
    flex: 1,
  },
  slider: {
    flex: 1,
    height: 40,
  },
});

// ============ Leaflet Map HTML (same as web frontend) ============
const buildLeafletHTML = () => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
  <meta name="mobile-web-app-capable" content="yes" />
  <meta name="apple-mobile-web-app-capable" content="yes" />
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" crossorigin="" />
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js" crossorigin=""></script>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    html, body { width: 100%; height: 100%; overflow: hidden; }
    #map { width: 100%; height: 100%; z-index: 0; }
    .leaflet-control-attribution { font-size: 9px !important; }
    .leaflet-control-zoom { display: none !important; }
    .reset-btn {
      position: absolute;
      bottom: 20px;
      right: 16px;
      z-index: 1000;
      background: rgba(255,255,255,0.95);
      border: none;
      border-radius: 8px;
      padding: 8px 14px;
      font-size: 13px;
      font-weight: 600;
      color: #ff6b35;
      cursor: pointer;
      box-shadow: 0 2px 8px rgba(0,0,0,0.15);
    }
    .user-icon {
      width: 20px;
      height: 20px;
      border-radius: 50%;
      background: #2196f3;
      border: 3px solid #fff;
      box-shadow: 0 0 0 2px rgba(33,150,243,0.4);
    }
  </style>
</head>
<body>
  <div id="map"></div>
  <button class="reset-btn" id="resetBtn" style="display:none">⟲ Vị trí</button>
  <script>
    var map = null;
    var userMarker = null;
    var poiCircles = {};
    var poiMarkers = {};
    var hasManualPan = false;

    function postToApp(msg) {
      try {
        if (window.ReactNativeWebView && window.ReactNativeWebView.postMessage) {
          window.ReactNativeWebView.postMessage(msg);
        } else if (window.parent && window.parent !== window) {
          window.parent.postMessage(msg, '*');
        }
      } catch (e) {}
    }

    function scheduleInvalidate() {
      [0, 200, 600].forEach(function (ms) {
        setTimeout(function () {
          if (map) { map.invalidateSize(true); }
        }, ms);
      });
    }

    function toIdSet(x) {
      if (!x) return null;
      if (x instanceof Set) return x;
      if (Array.isArray(x)) return new Set(x);
      return null;
    }

    function initMap() {
      if (map) return;
      map = L.map('map', {
        zoomControl: true,
        scrollWheelZoom: true,
        doubleClickZoom: true,
        dragging: true,
        touchZoom: true,
        boxZoom: true,
        keyboard: true,
      });
      L.tileLayer(
        'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
        { attribution: '&copy; OpenStreetMap contributors', maxZoom: 19 }
      ).addTo(map);

      map.setView([10.77, 106.65], 17);

      map.on('dragstart', function () { hasManualPan = true; });

      document.getElementById('resetBtn').addEventListener('click', function () {
        hasManualPan = false;
        if (userMarker) {
          map.setView(userMarker.getLatLng(), 18, { animate: true });
        }
        scheduleInvalidate();
      });

      scheduleInvalidate();
      postToApp(JSON.stringify({ type: 'mapReady' }));
    }

    window.addEventListener('message', function (e) {
      if (typeof e.data !== 'string' || e.data.charAt(0) !== '{') return;
      try {
        var payload = JSON.parse(e.data);
        if (payload.type === 'update') {
          updateMap(payload);
        }
      } catch (err) {}
    });

    function createUserIcon() {
      return L.divIcon({
        html: '<div class="user-icon"></div>',
        className: '',
        iconSize: [20, 20],
        iconAnchor: [10, 10],
      });
    }

    function createFoodIcon(isSelected, isPlaying) {
      var color = isPlaying ? '#22c55e' : isSelected ? '#ff6b35' : '#9ca3af';
      var bg = isPlaying ? '#e8f5e9' : isSelected ? '#fff3e0' : '#fff';
      return L.divIcon({
        html: '<div style="width:36px;height:36px;border-radius:50%;background:' + bg +
          ';border:2px solid ' + color + ';display:flex;align-items:center;' +
          'justify-content:center;font-size:16px;box-shadow:0 2px 6px rgba(0,0,0,0.2)">' +
          (isPlaying ? '🔊' : '🍜') + '</div>',
        className: '',
        iconSize: [36, 36],
        iconAnchor: [18, 18],
      });
    }

    function updateMap(data) {
      if (!map) return;

      var activeSet = toIdSet(data.activePOIIds);

      // Update center
      if (data.center && !hasManualPan) {
        map.setView([data.center.lat, data.center.lng], map.getZoom(), { animate: true });
        scheduleInvalidate();
      }

      // Update user marker
      if (data.userPos) {
        if (!userMarker) {
          userMarker = L.marker([data.userPos.lat, data.userPos.lng], {
            icon: createUserIcon(),
            draggable: true,
          }).addTo(map);
          userMarker.on('dragend', function (e) {
            var ll = e.target.getLatLng();
            postToApp(JSON.stringify({
              type: 'userDrag',
              lat: ll.lat,
              lng: ll.lng,
            }));
          });
        } else {
          userMarker.setLatLng([data.userPos.lat, data.userPos.lng]);
        }
        document.getElementById('resetBtn').style.display = 'block';
      }

      // Update POIs
      if (data.pois) {
        // Remove stale
        var incomingIds = new Set(data.pois.map(function(p) { return p.id; }));
        Object.keys(poiCircles).forEach(function(id) {
          if (!incomingIds.has(parseInt(id))) {
            poiCircles[id].remove();
            delete poiCircles[id];
          }
        });
        Object.keys(poiMarkers).forEach(function(id) {
          if (!incomingIds.has(parseInt(id))) {
            poiMarkers[id].remove();
            delete poiMarkers[id];
          }
        });

        data.pois.forEach(function(poi) {
          if (poi.lat == null || poi.lng == null) return;
          var isSelected = data.selectedId === poi.id;
          var isPlaying = activeSet && activeSet.has(poi.id);
          var radius = poi.triggerRadius || poi.accuracy || 30;
          var color = isPlaying ? '#22c55e' : isSelected ? '#ff6b35' : '#9ca3af';
          var dash = isPlaying ? undefined : '5, 5';
          var fillOp = isPlaying ? 0.2 : 0.1;
          var weight = isPlaying ? 3 : 2;

          if (!poiCircles[poi.id]) {
            poiCircles[poi.id] = L.circle([poi.lat, poi.lng], {
              radius: radius,
              color: color,
              fillColor: color,
              fillOpacity: fillOp,
              weight: weight,
              dashArray: dash,
            }).addTo(map);
          } else {
            poiCircles[poi.id].setStyle({ color, fillColor: color, fillOpacity: fillOp, weight, dashArray: dash });
            poiCircles[poi.id].setRadius(radius);
          }

          if (!poiMarkers[poi.id]) {
            poiMarkers[poi.id] = L.marker([poi.lat, poi.lng], {
              icon: createFoodIcon(isSelected, isPlaying),
            }).addTo(map);
            poiMarkers[poi.id].on('click', function () {
              postToApp(JSON.stringify({
                type: 'markerClick',
                poiId: poi.id,
              }));
            });
          } else {
            poiMarkers[poi.id].setIcon(createFoodIcon(isSelected, isPlaying));
          }
        });
      }

      // Pan to location
      if (data.panTo) {
        hasManualPan = false;
        map.setView([data.panTo.lat, data.panTo.lng], data.panTo.zoom || 18, { animate: true });
        scheduleInvalidate();
      }
    }

    function boot() {
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initMap);
      } else {
        initMap();
      }
    }
    boot();
  </script>
</body>
</html>
`;

// ============ MapScreen ============
const MapScreen: React.FC<MapScreenProps> = ({
  pois,
  loading,
  preferredLang,
  onPreferredLangChange,
}) => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const webviewRef = useRef<WebView>(null);
  const iframeRef = useRef<any>(null);
  const audioRef = useRef<Audio.Sound | null>(null);

  const [mockEnabled, setMockEnabled] = useState(true);
  const [mockLat, setMockLat] = useState<number | null>(null);
  const [mockLng, setMockLng] = useState<number | null>(null);
  const [autoGuide, setAutoGuide] = useState(true);

  const [playingLang, setPlayingLang] = useState<string | null>(null);
  const [loadingAudio, setLoadingAudio] = useState(false);
  const [activeNarrations, setActiveNarrations] = useState<ActiveNarration[]>([]);
  const [showPlayerBar, setShowPlayerBar] = useState(false);
  const [currentPOI, setCurrentPOI] = useState<NearbyPOI | null>(null);
  const [currentLang, setCurrentLang] = useState<string>("vi");
  const [showLangSelector, setShowLangSelector] = useState(false);
  const [webviewReady, setWebviewReady] = useState(false);

  /** Đồng bộ chip ngôn ngữ / lần phát tiếp theo với Cài đặt (preferredLang cập nhật khi quay lại tab Bản đồ). */
  useEffect(() => {
    setCurrentLang(preferredLang);
  }, [preferredLang]);

  useEffect(() => {
    Audio.setAudioModeAsync({
      allowsRecordingIOS: false,
      playsInSilentModeIOS: true,
      staysActiveInBackground: false,
      shouldDuckAndroid: true,
      playThroughEarpieceAndroid: false,
    }).catch(() => {});
  }, []);

  const postToMap = useCallback((msg: string) => {
    if (Platform.OS === "web") {
      iframeRef.current?.contentWindow?.postMessage(msg, "*");
    } else {
      webviewRef.current?.postMessage(msg);
    }
  }, []);

  const activePOIIds = useMemo(() => {
    return new Set(
      activeNarrations.filter((n) => n.status === "PLAYING").map((n) => n.poiId)
    );
  }, [activeNarrations]);

  // Initialise mock position from first POI
  useEffect(() => {
    if (mockLat == null && pois.length > 0) {
      const first = pois.find((p) => p.latitude != null && p.longitude != null);
      if (first && first.latitude != null && first.longitude != null) {
        setMockLat(first.latitude);
        setMockLng(first.longitude);
      }
    }
  }, [pois, mockLat]);

  // Send full map state to webview / iframe
  const sendMapUpdate = useCallback(() => {
    const poisWithCoords = pois.filter((p) => p.latitude != null && p.longitude != null);
    const webviewData = {
      type: "update" as const,
      center: mockLat != null && mockLng != null
        ? { lat: mockLat, lng: mockLng }
        : poisWithCoords[0]
          ? { lat: poisWithCoords[0].latitude!, lng: poisWithCoords[0].longitude! }
          : { lat: 21.0285, lng: 105.8542 },
      userPos: mockLat != null && mockLng != null ? { lat: mockLat, lng: mockLng } : null,
      pois: poisWithCoords.map((p) => ({
        id: p.id,
        lat: p.latitude!,
        lng: p.longitude!,
        triggerRadius: p.triggerRadiusMeters ?? p.accuracy ?? 30,
      })),
      selectedId: currentPOI?.id ?? null,
      activePOIIds: Array.from(activePOIIds),
    };

    postToMap(JSON.stringify(webviewData));
  }, [pois, mockLat, mockLng, currentPOI, activePOIIds, postToMap]);

  // Re-send when POIs load (initial load after webview is ready)
  useEffect(() => {
    if (webviewReady && pois.length > 0) {
      sendMapUpdate();
    }
  }, [webviewReady, pois.length, sendMapUpdate]);

  // Handle WebView messages
  const handleWebviewMessage = useCallback(
    (event: WebViewMessageEvent) => {
      try {
        const msg = JSON.parse(event.nativeEvent.data);
        if (msg.type === "mapReady") {
          setWebviewReady(true);
          if (pois.length > 0) sendMapUpdate();
        } else if (msg.type === "markerClick") {
          const poi = pois.find((p) => p.id === msg.poiId);
          if (poi) {
            setCurrentPOI(poi);
            setCurrentLang(preferredLang);
            setShowPlayerBar(true);
            postToMap(
              JSON.stringify({
                type: "update",
                panTo: poi.latitude != null && poi.longitude != null
                  ? { lat: poi.latitude, lng: poi.longitude, zoom: 18 }
                  : null,
                selectedId: poi.id,
              })
            );
          }
        } else if (msg.type === "userDrag") {
          setMockLat(msg.lat);
          setMockLng(msg.lng);
        }
      } catch {}
    },
    [pois, preferredLang, sendMapUpdate, postToMap]
  );

  useEffect(() => {
    if (Platform.OS !== "web" || typeof window === "undefined") return;
    const onWinMsg = (e: MessageEvent) => {
      if (typeof e.data !== "string" || e.data.charAt(0) !== "{") return;
      if (iframeRef.current && e.source !== iframeRef.current.contentWindow) return;
      handleWebviewMessage({ nativeEvent: { data: e.data } } as WebViewMessageEvent);
    };
    window.addEventListener("message", onWinMsg);
    return () => window.removeEventListener("message", onWinMsg);
  }, [handleWebviewMessage]);

  // Poll active narrations every 5s
  useEffect(() => {
    const poll = async () => {
      try {
        const res: any = await api.get("/api/v1/app/dashboard/active");
        setActiveNarrations(unwrapListResponse<ActiveNarration>(res.data));
      } catch {}
    };
    poll();
    const interval = setInterval(poll, 5000);
    return () => clearInterval(interval);
  }, []);

  const playAudio = useCallback(
    async (poi: NearbyPOI, lang: string) => {
      try {
        setLoadingAudio(true);
        const poiUse = await fetchPOIWithAudios(poi);
        setCurrentPOI((prev) => (prev?.id === poiUse.id ? poiUse : prev));

        const picked = pickAudioInfo(poiUse, lang);
        if (!picked || !poiUse.groupKey) {
          Alert.alert(
            "Chưa có audio",
            "Địa điểm này chưa có dữ liệu thuyết minh (audios/groupKey). Kéo tải lại trang chủ hoặc cập nhật backend."
          );
          return;
        }
        if (picked.info?.audioId == null) {
          Alert.alert("Thiếu audioId", "Không tìm thấy bản ghi audio cho ngôn ngữ này.");
          return;
        }

        const langFinal = picked.lang;
        setCurrentLang(langFinal);

        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

        if (audioRef.current) {
          await audioRef.current.unloadAsync();
          audioRef.current = null;
        }

        const audioUrl = getAudioStreamUrl(poiUse.groupKey, langFinal);
        const { sound } = await Audio.Sound.createAsync({ uri: audioUrl });
        audioRef.current = sound;
        setPlayingLang(langFinal);
        await sound.playAsync();

        try {
          const deviceId = await deviceService.getDeviceId();
          await api.post("/api/v1/app/narration/start", {
            deviceId,
            poiId: poiUse.id,
            audioId: picked.info.audioId,
            languageCode: langFinal,
            latitude: mockLat ?? undefined,
            longitude: mockLng ?? undefined,
          });
        } catch (e) {
          console.warn("startNarration failed:", e);
        }

        sound.setOnPlaybackStatusUpdate((status: any) => {
          if (status.isLoaded && status.didJustFinish) {
            setPlayingLang(null);
            storageService.addToNarrationHistory({
              poiId: poiUse.id,
              poiName: poiUse.foodName,
              audioId: picked.info.audioId,
              languageCode: langFinal,
            });
          }
        });
      } catch (err: any) {
        console.warn("playAudio failed:", err);
        Alert.alert(
          "Không phát được audio",
          err?.message || "Kiểm tra backend đang chạy và CORS cho file âm thanh (trình duyệt)."
        );
      } finally {
        setLoadingAudio(false);
      }
    },
    [mockLat, mockLng]
  );

  // Geofence handlers
  const handlePOIEnter = useCallback(
    async (geofence: POIGeofence) => {
      const poi = geofence.poi;
      setCurrentPOI(poi);
      setCurrentLang(preferredLang);

      if (autoGuide) {
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        setShowPlayerBar(true);
        await playAudio(poi, preferredLang);
      }
    },
    [autoGuide, preferredLang, playAudio]
  );

  const handlePOIExit = useCallback(() => {}, []);

  const { currentPOI: inRangePOI } = useGeofence({
    pois,
    mockEnabled,
    mockLat,
    mockLng,
    autoGuide,
    onPOIEnter: handlePOIEnter,
    onPOIExit: handlePOIExit,
  });

  const stopAudio = useCallback(async () => {
    if (audioRef.current) {
      await audioRef.current.stopAsync();
      await audioRef.current.unloadAsync();
      audioRef.current = null;
    }
    setPlayingLang(null);
    setShowPlayerBar(false);
  }, []);

  const handleLangSelect = useCallback(
    async (lang: string) => {
      setShowLangSelector(false);
      setCurrentLang(lang);
      onPreferredLangChange(lang);
      if (currentPOI) {
        await playAudio(currentPOI, lang);
      }
    },
    [currentPOI, onPreferredLangChange, playAudio]
  );

  const isPlaying = playingLang != null;

  const mockRange = useMemo(() => {
    const withCoords = pois.filter((p) => p.latitude != null && p.longitude != null);
    if (withCoords.length === 0) return null;
    const lats = withCoords.map((p) => p.latitude!);
    const lngs = withCoords.map((p) => p.longitude!);
    const pad = 0.001;
    return {
      latMin: Math.min(...lats) - pad,
      latMax: Math.max(...lats) + pad,
      lngMin: Math.min(...lngs) - pad,
      lngMax: Math.max(...lngs) + pad,
    };
  }, [pois]);

  const mockPanelBottom = showPlayerBar ? 130 : 30;

  // Sync position changes to webview (only when mockEnabled)
  useEffect(() => {
    if (webviewReady && mockEnabled) {
      sendMapUpdate();
    }
  }, [webviewReady, mockLat, mockLng]);

  // Sync active narrations to webview
  useEffect(() => {
    if (webviewReady) {
      postToMap(JSON.stringify({ type: "update", activePOIIds: Array.from(activePOIIds) }));
    }
  }, [activePOIIds, webviewReady, postToMap]);

  const handleMockLatLive = useCallback(
    (v: number) => {
      postToMap(
        JSON.stringify({
          type: "update",
          userPos: { lat: v, lng: mockLng ?? v },
          center: { lat: v, lng: mockLng ?? v },
        })
      );
    },
    [mockLng, postToMap]
  );

  const handleMockLatComplete = useCallback((v: number) => {
    setMockLat(v);
  }, []);

  const handleMockLngLive = useCallback(
    (v: number) => {
      postToMap(
        JSON.stringify({
          type: "update",
          userPos: { lat: mockLat ?? v, lng: v },
          center: { lat: mockLat ?? v, lng: v },
        })
      );
    },
    [mockLat, postToMap]
  );

  const handleMockLngComplete = useCallback((v: number) => {
    setMockLng(v);
  }, []);

  const webviewSource = useMemo(
    () => ({
      html: buildLeafletHTML(),
      baseUrl: "https://localhost",
    }),
    []
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#ff6b35" />
        <Text style={styles.loadingText}>Đang tải bản đồ...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* ====== MAP: Web dùng iframe + Leaflet; native dùng WebView ====== */}
      {Platform.OS === "web" ? (
        createElement("iframe", {
          ref: iframeRef,
          title: "map",
          srcDoc: buildLeafletHTML(),
          style: {
            width: "100%",
            flex: 1,
            minHeight: SCREEN_H * 0.52,
            border: "none",
            backgroundColor: "#dedede",
          },
        } as any)
      ) : (
        <WebView
          ref={webviewRef}
          style={styles.map}
          source={webviewSource}
          onMessage={handleWebviewMessage}
          originWhitelist={["*"]}
          allowFileAccess={true}
          javaScriptEnabled={true}
          domStorageEnabled={true}
          mixedContentMode="always"
          androidLayerType="hardware"
          scrollEnabled={false}
          showsVerticalScrollIndicator={false}
          showsHorizontalScrollIndicator={false}
          bounces={false}
          overScrollMode="never"
          onError={(e) => console.warn("WebView error:", e.nativeEvent.description)}
        />
      )}

      {/* ====== TOP BAR ====== */}
      <SafeAreaView style={styles.topBarSafe}>
        <View style={styles.topBar}>
          <View>
            <Text style={styles.topBarTitle}>🍜 Phố Ẩm Thực</Text>
            <Text style={styles.topBarSub}>{pois.length} địa điểm</Text>
          </View>
          <View style={[styles.modeBadge, !mockEnabled && styles.modeBadgeGps]}>
            <Text style={[styles.modeBadgeText, !mockEnabled && styles.modeBadgeTextGps]}>
              {mockEnabled ? "📍 Giả lập" : "📡 GPS thực"}
            </Text>
          </View>
        </View>
      </SafeAreaView>

      {/* ====== MOCK GPS PANEL ====== */}
      {mockEnabled && mockRange && (
        <View style={[styles.mockPanel, { bottom: mockPanelBottom }]}>
          <View style={styles.mockPanelHeader}>
            <Text style={styles.mockPanelTitle}>📍 Giả lập GPS</Text>
            <TouchableOpacity
              style={styles.mockPanelGpsBtn}
              onPress={() => setMockEnabled(false)}
            >
              <Text style={styles.mockPanelGpsBtnText}>📡 GPS thực</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.mockRow}>
            <Text style={styles.mockLabel}>LAT</Text>
            <Text style={styles.mockValue}>{mockLat?.toFixed(6) ?? "--"}</Text>
            <View style={styles.mockSliderWrap}>
              <MockSlider
                min={mockRange.latMin}
                max={mockRange.latMax}
                value={mockLat ?? mockRange.latMin}
                onValueChange={handleMockLatLive}
                onSlidingComplete={handleMockLatComplete}
              />
            </View>
          </View>

          <View style={styles.mockRow}>
            <Text style={styles.mockLabel}>LNG</Text>
            <Text style={styles.mockValue}>{mockLng?.toFixed(6) ?? "--"}</Text>
            <View style={styles.mockSliderWrap}>
              <MockSlider
                min={mockRange.lngMin}
                max={mockRange.lngMax}
                value={mockLng ?? mockRange.lngMin}
                onValueChange={handleMockLngLive}
                onSlidingComplete={handleMockLngComplete}
              />
            </View>
          </View>

          <View style={styles.autoGuideRow}>
            <Text style={styles.autoGuideLabel}>TỰ ĐỘNG PHÁT</Text>
            <TouchableOpacity
              style={[styles.toggleBtn, autoGuide && styles.toggleBtnActive]}
              onPress={() => setAutoGuide((v) => !v)}
            >
              <Text style={[styles.toggleBtnText, autoGuide && styles.toggleBtnTextActive]}>
                {autoGuide ? "BẬT" : "TẮT"}
              </Text>
            </TouchableOpacity>
          </View>

          {inRangePOI && (
            <TouchableOpacity
              style={styles.nearbyAlert}
              onPress={() => {
                const poi = inRangePOI.poi;
                if (poi.latitude != null && poi.longitude != null) {
                  postToMap(
                    JSON.stringify({
                      type: "update",
                      panTo: { lat: poi.latitude, lng: poi.longitude, zoom: 18 },
                      selectedId: poi.id,
                    })
                  );
                }
                setCurrentPOI(poi);
                setCurrentLang(preferredLang);
                setShowPlayerBar(true);
              }}
            >
              <Text style={styles.nearbyAlertText}>
                🍜 {inRangePOI.poi.foodName || `POI #${inRangePOI.poi.id}`}
              </Text>
              <Text style={styles.nearbyAlertDist}>{formatDistance(inRangePOI.distance)}</Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {!mockEnabled && (
        <TouchableOpacity
          style={styles.gpsEnableBtn}
          onPress={() => setMockEnabled(true)}
        >
          <Text style={styles.gpsEnableBtnText}>📍 Bật giả lập GPS</Text>
        </TouchableOpacity>
      )}

      {/* ====== PLAYER BAR ====== */}
      {showPlayerBar && currentPOI && (
        <View style={styles.playerBar}>
          <View style={styles.playerBarInfo}>
            <Text style={styles.playerBarName} numberOfLines={1}>
              {currentPOI.foodName || `POI #${currentPOI.id}`}
            </Text>
            <TouchableOpacity
              style={styles.langChip}
              onPress={() => setShowLangSelector((v) => !v)}
            >
              <Text style={styles.langChipText}>
                {LANGUAGE_LABELS[currentLang] || currentLang}
              </Text>
            </TouchableOpacity>
          </View>

          {showLangSelector && (
            <View style={styles.langSelector}>
              {Object.entries(currentPOI.audios || {}).map(([lang, audio]) => (
                <TouchableOpacity
                  key={lang}
                  style={[styles.langOption, currentLang === lang && styles.langOptionActive]}
                  onPress={() => handleLangSelect(lang)}
                >
                  <View
                    style={[
                      styles.langDot,
                      { backgroundColor: LANGUAGE_COLORS[lang] || "#888" },
                    ]}
                  />
                  <Text
                    style={[
                      styles.langOptionText,
                      currentLang === lang && styles.langOptionTextActive,
                    ]}
                  >
                    {LANGUAGE_LABELS[lang] || lang}
                  </Text>
                  {playingLang === lang && <Text style={styles.playingEmoji}>🔊</Text>}
                </TouchableOpacity>
              ))}
            </View>
          )}

          <View style={styles.playerBarControls}>
            {loadingAudio ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <>
                <TouchableOpacity
                  style={[styles.playerBtn, isPlaying && styles.playerBtnPlaying]}
                  onPress={() => {
                    if (isPlaying) {
                      stopAudio();
                      return;
                    }
                    void playAudio(currentPOI, currentLang);
                  }}
                >
                  <Text style={styles.playerBtnText}>{isPlaying ? "⏸" : "▶"}</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.playerStopBtn} onPress={stopAudio}>
                  <Text style={styles.playerStopBtnText}>⏹</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      )}

      {activePOIIds.size > 0 && (
        <View style={styles.activeCountBadge}>
          <Text style={styles.activeCountText}>🔊 {activePOIIds.size} đang phát</Text>
        </View>
      )}
    </View>
  );
};

// ============ Styles ============
const styles = StyleSheet.create({
  container: { flex: 1 },
  map: { flex: 1 },
  loadingContainer: {
    flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: "#f8f9fa",
  },
  loadingText: { marginTop: 12, fontSize: 14, color: "#888" },

  // Top bar
  topBarSafe: { position: "absolute", top: 0, left: 0, right: 0, zIndex: 10 },
  topBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: Platform.OS === "ios" ? 8 : 44,
    paddingHorizontal: 16,
    paddingBottom: 12,
    backgroundColor: "rgba(255,255,255,0.95)",
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  topBarTitle: { fontSize: 18, fontWeight: "bold", color: "#222" },
  topBarSub: { fontSize: 12, color: "#888", marginTop: 2 },
  modeBadge: {
    paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, backgroundColor: "#fff3e0",
  },
  modeBadgeGps: { backgroundColor: "#e3f2fd" },
  modeBadgeText: { fontSize: 12, fontWeight: "600", color: "#e65100" },
  modeBadgeTextGps: { color: "#1565c0" },

  // Mock GPS panel
  mockPanel: {
    position: "absolute",
    left: 16, right: 16,
    backgroundColor: "rgba(255,255,255,0.97)",
    borderRadius: 16, padding: 16,
    shadowColor: "#000", shadowOpacity: 0.12, shadowRadius: 12, elevation: 6,
    zIndex: 10,
  },
  mockPanelHeader: {
    flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12,
  },
  mockPanelTitle: { fontSize: 14, fontWeight: "700", color: "#333" },
  mockPanelGpsBtn: {
    paddingHorizontal: 10, paddingVertical: 4, backgroundColor: "#e3f2fd", borderRadius: 12,
  },
  mockPanelGpsBtnText: { fontSize: 12, fontWeight: "600", color: "#1565c0" },
  mockRow: { flexDirection: "row", alignItems: "center", marginBottom: 8 },
  mockLabel: { fontSize: 11, fontWeight: "700", color: "#888", width: 30 },
  mockValue: {
    fontSize: 11, color: "#555", width: 90,
    fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace",
  },
  mockSliderWrap: { flex: 1, paddingLeft: 4 },
  autoGuideRow: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    marginTop: 8, paddingTop: 8, borderTopWidth: 1, borderTopColor: "#f0f0f0",
  },
  autoGuideLabel: { fontSize: 12, fontWeight: "600", color: "#555" },
  toggleBtn: {
    paddingHorizontal: 14, paddingVertical: 6, borderRadius: 16,
    backgroundColor: "#f5f5f5", borderWidth: 1, borderColor: "#ddd",
  },
  toggleBtnActive: { backgroundColor: "#ff6b35", borderColor: "#ff6b35" },
  toggleBtnText: { fontSize: 12, fontWeight: "700", color: "#888" },
  toggleBtnTextActive: { color: "#fff" },
  nearbyAlert: {
    flexDirection: "row", justifyContent: "space-between", alignItems: "center",
    marginTop: 10, padding: 10, backgroundColor: "#fff3e0",
    borderRadius: 10, borderWidth: 1, borderColor: "#ffcc80",
  },
  nearbyAlertText: { fontSize: 13, fontWeight: "600", color: "#e65100", flex: 1 },
  nearbyAlertDist: { fontSize: 13, fontWeight: "700", color: "#ff6b35" },

  // GPS enable btn
  gpsEnableBtn: {
    position: "absolute", bottom: 30, right: 16,
    backgroundColor: "rgba(255,255,255,0.97)",
    paddingHorizontal: 14, paddingVertical: 10, borderRadius: 20,
    shadowColor: "#000", shadowOpacity: 0.12, shadowRadius: 8, elevation: 4,
    zIndex: 10,
  },
  gpsEnableBtnText: { fontSize: 13, fontWeight: "600", color: "#ff6b35" },

  // Player bar
  playerBar: {
    position: "absolute", bottom: 0, left: 0, right: 0,
    backgroundColor: "#1a1a1a",
    paddingHorizontal: 16, paddingVertical: 14,
    paddingBottom: Platform.OS === "ios" ? 34 : 14,
    borderTopLeftRadius: 20, borderTopRightRadius: 20,
    shadowColor: "#000", shadowOpacity: 0.3, shadowRadius: 12, elevation: 8,
    zIndex: 10,
  },
  playerBarInfo: { flexDirection: "row", alignItems: "center", marginBottom: 10 },
  playerBarName: { flex: 1, fontSize: 15, fontWeight: "600", color: "#fff" },
  langChip: {
    paddingHorizontal: 10, paddingVertical: 4,
    backgroundColor: "rgba(255,255,255,0.15)", borderRadius: 12, marginLeft: 8,
  },
  langChipText: { fontSize: 12, fontWeight: "600", color: "#fff" },
  langSelector: {
    marginBottom: 10, backgroundColor: "rgba(255,255,255,0.1)",
    borderRadius: 10, overflow: "hidden",
  },
  langOption: {
    flexDirection: "row", alignItems: "center",
    paddingHorizontal: 14, paddingVertical: 10,
    borderBottomWidth: 1, borderBottomColor: "rgba(255,255,255,0.08)",
  },
  langOptionActive: { backgroundColor: "rgba(255,255,255,0.08)" },
  langDot: { width: 8, height: 8, borderRadius: 4, marginRight: 8 },
  langOptionText: { flex: 1, fontSize: 13, color: "#ccc" },
  langOptionTextActive: { color: "#fff", fontWeight: "600" },
  playingEmoji: { fontSize: 14 },
  playerBarControls: { flexDirection: "row", alignItems: "center", gap: 12 },
  playerBtn: {
    width: 52, height: 52, borderRadius: 26, backgroundColor: "#ff6b35",
    alignItems: "center", justifyContent: "center",
    shadowColor: "#ff6b35", shadowOpacity: 0.4, shadowRadius: 8, elevation: 4,
  },
  playerBtnPlaying: { backgroundColor: "#ff8a50" },
  playerBtnText: { fontSize: 22, color: "#fff" },
  playerStopBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.15)", alignItems: "center", justifyContent: "center",
  },
  playerStopBtnText: { fontSize: 18, color: "#fff" },

  // Active count
  activeCountBadge: {
    position: "absolute",
    top: Platform.OS === "ios" ? 110 : 96, right: 16,
    backgroundColor: "#e8f5e9",
    paddingHorizontal: 10, paddingVertical: 6, borderRadius: 12,
    borderWidth: 1, borderColor: "#a5d6a7",
    zIndex: 10,
  },
  activeCountText: { fontSize: 12, fontWeight: "700", color: "#2e7d32" },
});

export default MapScreen;
