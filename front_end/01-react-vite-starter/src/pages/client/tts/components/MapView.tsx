import { GeoPosition } from "../types";
import { TTSMap } from "./TTSMap";
import type { TTSAudio } from "@/api/tts.api";
import { Map } from "leaflet";

interface MapViewProps {
  center: GeoPosition;
  position: GeoPosition | null;
  audios: TTSAudio[];
  selected: TTSAudio | null;
  autoGuide: boolean;
  onMarkerDrag: (lat: number, lng: number) => void;
  onMarkerClick: (id: number) => void;
  mapRef: React.MutableRefObject<Map | null>;
  hasManualPanRef: React.MutableRefObject<boolean>;
}

export const MapView = ({
  center,
  position,
  audios,
  selected,
  autoGuide,
  onMarkerDrag,
  onMarkerClick,
  mapRef,
  hasManualPanRef,
}: MapViewProps) => {
  return (
    <div className="gps-map-page">
      <div className="gps-map-header">
        <div>
          <div className="gps-map-title">Bản đồ Ẩm thực</div>
          <div className="gps-map-subtitle">Theo dõi vị trí của bạn trong khu phố</div>
        </div>
        <div className="gps-map-right">
          <div className="live-gps-pill">
            LIVE GPS: {center.lat.toFixed(4)}, {center.lng.toFixed(4)}
          </div>
          <div className="auto-guide-chip">
            <span className={`dot-indicator ${autoGuide ? "on" : "off"}`} />
            <span>Tự động phát: {autoGuide ? "BẬT" : "TẮT"}</span>
          </div>
        </div>
      </div>

      <TTSMap
        center={center}
        position={position}
        audios={audios}
        selected={selected}
        onMarkerDrag={onMarkerDrag}
        onMarkerClick={onMarkerClick}
        mapRef={mapRef}
        hasManualPanRef={hasManualPanRef}
      />
    </div>
  );
};
