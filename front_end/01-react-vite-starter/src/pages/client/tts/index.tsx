import { Map } from "leaflet";
import "leaflet/dist/leaflet.css";
import { useEffect, useMemo, useRef, useState } from "react";
import { MapView } from "./components/MapView";
import { TTSDetailView } from "./components/TTSDetailView";
import { TTSSidebar } from "./components/TTSSidebar";
import { useAudioPlayer } from "./hooks/useAudioPlayer";
import { useGeolocation } from "./hooks/useGeolocation";
import { useMapPosition } from "./hooks/useMapPosition";
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

  const { isPlaying, setIsPlaying, audioRef, handlePlayPause } = useAudioPlayer(selected, position);

  // Sync position với mockLat/mockLng khi slider thay đổi
  useEffect(() => {
    if (!mockGps || mockLat == null || mockLng == null) return;
    if (position?.lat !== mockLat || position?.lng !== mockLng) {
      setPosition({ lat: mockLat, lng: mockLng });
      lastPositionSourceRef.current = "slider";
    }
  }, [mockGps, mockLat, mockLng, position, setPosition]);

  // Tự chọn điểm gần nhất trong bán kính
  useEffect(() => {
    if (!autoGuide || !position || audios.length === 0) return;

    let bestId: number | null = null;
    let bestDist = Infinity;

    audios.forEach((audio) => {
      if (audio.latitude != null && audio.longitude != null) {
        const dist = haversineDistance(position, { lat: audio.latitude, lng: audio.longitude });
        const radius = audio.accuracy ?? 50;
        if (dist <= radius && dist < bestDist) {
          bestDist = dist;
          bestId = audio.id;
        }
      }
    });

    if (bestId != null && bestId !== selectedId) {
      setSelectedId(bestId);
    }
  }, [autoGuide, position, audios, selectedId]);

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
