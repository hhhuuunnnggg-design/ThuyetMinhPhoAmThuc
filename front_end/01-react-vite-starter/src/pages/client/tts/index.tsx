import { Map } from "leaflet";
import "leaflet/dist/leaflet.css";
import { useEffect, useMemo, useRef, useState } from "react";
import { MapView } from "./components/MapView";
import { TTSDetailView } from "./components/TTSDetailView";
import { TTSSidebar } from "./components/TTSSidebar";
import { useAudioPlayer } from "./hooks/useAudioPlayer";
import { useGeolocation } from "./hooks/useGeolocation";
import { useMapPosition } from "./hooks/useMapPosition";
import { useNarrationEngine } from "./hooks/useNarrationEngine";
import { useNarrationEngineWithBackend } from "./hooks/useNarrationEngineWithBackend";
import { useTTSAudios } from "./hooks/useTTSAudios";
import "./tts.scss";
import { GeoPosition, ViewMode } from "./types";
import { haversineDistance } from "./utils/geo";

const TTSPage = () => {
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [autoGuide, setAutoGuide] = useState(true);
  const [viewMode, setViewMode] = useState<ViewMode>("detail");
  const [mockGps, setMockGps] = useState(true);
  const mapRef = useRef<Map | null>(null);
  const hasManualPanRef = useRef(false);
  // Narration Engine: Có thể chọn dùng backend API hoặc local engine
  const useBackendNarration = true; // Set false nếu muốn quay lại local engine

  // Hooks
  const { audios, loading } = useTTSAudios();
  const {
    mockLat,
    setMockLat,
    mockLng,
    setMockLng,
    latRange,
    lngRange,
    position,
    setPosition,
    sortedAudios,
  } = useMapPosition(audios);

  const { geoEnabled, geoError, lastPositionSourceRef } = useGeolocation({
    autoGuide,
    mockGps,
    mockLat,
    mockLng,
    onPositionUpdate: (pos, source) => {
      setPosition(pos);
      if (source === "gps" && mockGps) {
        setMockLat(pos.lat);
        setMockLng(pos.lng);
      }
    },
  });

  const selected = useMemo(
    () => audios.find((a) => a.id === selectedId) || audios[0] || null,
    [audios, selectedId]
  );

  // State cho auto-play từ Narration Engine
  const [autoPlayAudioId, setAutoPlayAudioId] = useState<number | null>(null);

  const { deviceId } = useNarrationEngineWithBackend({
    audios,
    position,
    autoGuide,
    isPlaying: false, // sẽ được cập nhật sau khi init audio player
    useBackend: useBackendNarration,
    onPOIDetected: (poiId) => {
      // Geofence Engine đã phát hiện POI -> cập nhật selected
      setSelectedId(poiId);
    },
    onShouldPlay: (audioId) => {
      // Narration Engine quyết định phát -> set auto-play
      setAutoPlayAudioId(audioId);
      // Reset sau khi đã set để có thể trigger lại lần sau
      setTimeout(() => setAutoPlayAudioId(null), 100);
    },
  });

  const { isPlaying, setIsPlaying, audioRef, handlePlayPause } = useAudioPlayer({
    selected,
    position,
    autoPlayAudioId,
    deviceId: useBackendNarration ? deviceId : undefined,
    useBackendLogging: useBackendNarration,
  });

  // Debug: Log deviceId và useBackendNarration
  useEffect(() => {
    if (useBackendNarration) {
      console.log("🔧 Narration Engine Config:", {
        useBackendNarration,
        deviceId,
        hasSelected: !!selected,
        selectedId: selected?.id,
      });
    }
  }, [useBackendNarration, deviceId, selected]);

  // Sync position với mockLat/mockLng khi slider thay đổi
  useEffect(() => {
    if (!mockGps || mockLat == null || mockLng == null) return;
    if (position?.lat !== mockLat || position?.lng !== mockLng) {
      setPosition({ lat: mockLat, lng: mockLng });
      lastPositionSourceRef.current = "slider";
    }
  }, [mockGps, mockLat, mockLng, position, setPosition]);

  // Log narration đã được xử lý trong useAudioPlayer hook

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
            onPlayPause={handlePlayPause}
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
