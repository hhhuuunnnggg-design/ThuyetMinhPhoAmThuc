import { Map } from "leaflet";
import "leaflet/dist/leaflet.css";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { getActiveNarrationsAPI, type ActiveNarration } from "@/api/app.api";
import { MapView } from "./components/MapView";
import { TTSDetailView } from "./components/TTSDetailView";
import { TTSSidebar } from "./components/TTSSidebar";
import { useAudioPlayer } from "./hooks/useAudioPlayer";
import { useGeolocation } from "./hooks/useGeolocation";
import { useMapPosition } from "./hooks/useMapPosition";
import { useNarrationEngineWithBackend } from "./hooks/useNarrationEngineWithBackend";
import { useTTSAudios } from "./hooks/useTTSAudios";
import "./tts.scss";
import { GeoPosition, PositionSource, ViewMode } from "./types";
import { haversineDistance } from "./utils/geo";

const TTSPage = () => {
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [autoGuide, setAutoGuide] = useState(true);
  const [viewMode, setViewMode] = useState<ViewMode>("detail");
  const [mockGps, setMockGps] = useState(true);
  const [mockLat, setMockLat] = useState<number | null>(null);
  const [mockLng, setMockLng] = useState<number | null>(null);
  const mapRef = useRef<Map | null>(null);
  const hasManualPanRef = useRef(false);
  const useBackendNarration = true;
  const [activePOIIds, setActivePOIIds] = useState<Set<number>>(new Set());
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Poll active narrations every 5s
  const fetchActiveNarrations = useCallback(async () => {
    try {
      const res: any = await getActiveNarrationsAPI();
      const data = Array.isArray(res?.data) ? res.data : res?.data?.result || [];
      const playingPOIIds = new Set(
        (data as ActiveNarration[])
          .filter((n) => n.status === "PLAYING")
          .map((n) => n.poiId)
      );
      setActivePOIIds(playingPOIIds);
    } catch {}
  }, []);

  useEffect(() => {
    fetchActiveNarrations();
    pollingRef.current = setInterval(fetchActiveNarrations, 5000);
    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, [fetchActiveNarrations]);

  // Hooks
  const { audios, loading } = useTTSAudios();
  const {
    position,
    setPosition,
    latRange,
    lngRange,
    sortedAudios,
  } = useMapPosition(audios);

  /** Bắt buộc ổn định tham chiếu: useGeolocation đặt onPositionUpdate trong deps của useEffect — inline fn → render vô hạn. */
  const onPositionUpdate = useCallback(
    (pos: GeoPosition, source: PositionSource) => {
      setPosition(pos);
      if (source === "gps" && mockGps) {
        setMockLat(pos.lat);
        setMockLng(pos.lng);
      }
    },
    [setPosition, mockGps],
  );

  const { geoEnabled, geoError, lastPositionSourceRef } = useGeolocation({
    autoGuide,
    mockGps,
    mockLat,
    mockLng,
    onPositionUpdate,
  });

  // Initialize mock position from sortedAudios when position is first set
  const mockInitialized = useRef(false);
  useEffect(() => {
    if (!mockInitialized.current && position && sortedAudios.length > 0) {
      mockInitialized.current = true;
      const first = sortedAudios.find(
        (a) => a.latitude != null && a.longitude != null
      );
      if (first && first.latitude != null && first.longitude != null) {
        setMockLat(first.latitude);
        setMockLng(first.longitude);
      }
    }
  }, [position, sortedAudios]);

  // Sync position from mock sliders
  useEffect(() => {
    if (!mockGps || mockLat == null || mockLng == null) return;
    setPosition({ lat: mockLat, lng: mockLng });
  }, [mockGps, mockLat, mockLng, setPosition]);

  const selected = useMemo(
    () => audios.find((a) => a.id === selectedId) || audios[0] || null,
    [audios, selectedId]
  );

  /** Đồng bộ với dropdown ngôn ngữ + stream API ?languageCode= */
  const [narrationLang, setNarrationLang] = useState("vi");
  useEffect(() => {
    setNarrationLang("vi");
  }, [selected?.id]);

  // State cho auto-play từ Narration Engine
  const [autoPlayAudioId, setAutoPlayAudioId] = useState<number | null>(null);
  const lastRequestedAudioIdRef = useRef<number | null>(null);

  // Memoize callbacks để tránh vòng lặp vô hạn
  const handlePOIDetected = useCallback((poiId: number) => {
    // Geofence Engine đã phát hiện POI -> cập nhật selected
    setSelectedId(poiId);
  }, []);

  const handleShouldPlay = useCallback((audioId: number) => {
    // Tránh gọi lại nếu đã yêu cầu phát audio này
    if (lastRequestedAudioIdRef.current === audioId) {
      return;
    }
    lastRequestedAudioIdRef.current = audioId;
    
    // Narration Engine quyết định phát -> set auto-play
    setAutoPlayAudioId(audioId);
    
    // Reset sau khi đã set để có thể trigger lại lần sau
    setTimeout(() => {
      setAutoPlayAudioId(null);
      // Reset ref sau một khoảng thời gian để có thể phát lại
      setTimeout(() => {
        lastRequestedAudioIdRef.current = null;
      }, 5000); // 5 giây cooldown
    }, 100);
  }, []);

  const { deviceId } = useNarrationEngineWithBackend({
    audios,
    position,
    autoGuide,
    isPlaying: false, // sẽ được cập nhật sau khi init audio player
    useBackend: useBackendNarration,
    onPOIDetected: handlePOIDetected,
    onShouldPlay: handleShouldPlay,
  });

  const {
    isPlaying,
    setIsPlaying,
    audioRef,
    handlePlayPause,
    audioDuration,
    playAudioForLanguage,
  } = useAudioPlayer({
    selected,
    position,
    autoPlayAudioId,
    deviceId: useBackendNarration ? deviceId : undefined,
    useBackendLogging: useBackendNarration,
    playbackLanguageCode: narrationLang,
  });

  const handlePlayLanguage = useCallback(
    (lang: string) => {
      setNarrationLang(lang);
      if (selected) {
        playAudioForLanguage(selected.id, lang, selected.groupKey);
      }
    },
    [selected, playAudioForLanguage],
  );

  // Set initial selectedId
  useEffect(() => {
    if (audios.length > 0 && selectedId == null) {
      setSelectedId(audios[0].id);
    }
  }, [audios, selectedId]);

  const currentDistance = useMemo(() => {
    if (!position || !selected || selected.latitude == null || selected.longitude == null)
      return null;
    return Math.round(
      haversineDistance(position, { lat: selected.latitude, lng: selected.longitude })
    );
  }, [position, selected]);

  const miniMapCenter = useMemo<GeoPosition | null>(() => {
    if (position) return position;
    if (selected && selected.latitude != null && selected.longitude != null) {
      return { lat: selected.latitude, lng: selected.longitude };
    }
    return null;
  }, [position, selected]);

  const handleSelect = (id: number) => {
    setSelectedId(id);
  };

  const handleMarkerDrag = (lat: number, lng: number) => {
    setMockLat(lat);
    setMockLng(lng);
    setPosition({ lat, lng });
    lastPositionSourceRef.current = "drag";
    setMockGps(true);
  };

  if (!miniMapCenter) {
    return <div>Đang tải...</div>;
  }

  return (
    <div className="gps-food-page">
      <TTSSidebar
        autoGuide={autoGuide}
        viewMode={viewMode}
        mockGps={mockGps}
        geoEnabled={geoEnabled}
        latRange={latRange}
        lngRange={lngRange}
        mockLat={mockLat}
        mockLng={mockLng}
        audios={sortedAudios}
        selectedId={selectedId}
        loading={loading}
        position={position}
        onAutoGuideChange={setAutoGuide}
        onViewModeChange={setViewMode}
        onMockGpsChange={setMockGps}
        onLatChange={setMockLat}
        onLngChange={setMockLng}
        onSelect={handleSelect}
      />

      <div className="gps-food-main">
        {selected && viewMode === "detail" && (
          <TTSDetailView
            selected={selected}
            currentDistance={currentDistance}
            isPlaying={isPlaying}
            autoGuide={autoGuide}
            geoError={geoError}
            audioDuration={audioDuration}
            onPlayPause={handlePlayPause}
            onPlayLanguage={handlePlayLanguage}
            narrationLang={narrationLang}
          />
        )}

        {selected && viewMode === "map" && (
          <MapView
            center={miniMapCenter}
            position={position}
            audios={audios}
            selected={selected}
            autoGuide={autoGuide}
            onMarkerDrag={handleMarkerDrag}
            onMarkerClick={handleSelect}
            mapRef={mapRef}
            hasManualPanRef={hasManualPanRef}
            activePOIIds={activePOIIds}
          />
        )}

        <audio
          ref={audioRef}
          onEnded={() => setIsPlaying(false)}
          style={{ display: "none" }}
        />
      </div>
    </div>
  );
};

export default TTSPage;
