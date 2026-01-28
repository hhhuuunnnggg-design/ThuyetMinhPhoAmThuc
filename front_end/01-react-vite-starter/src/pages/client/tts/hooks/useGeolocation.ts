import { useEffect, useRef, useState } from "react";
import { GeoPosition, PositionSource } from "../types";

interface UseGeolocationProps {
  autoGuide: boolean;
  mockGps: boolean;
  mockLat: number | null;
  mockLng: number | null;
  onPositionUpdate: (pos: GeoPosition, source: PositionSource) => void;
}

export const useGeolocation = ({
  autoGuide,
  mockGps,
  mockLat,
  mockLng,
  onPositionUpdate,
}: UseGeolocationProps) => {
  const [geoEnabled, setGeoEnabled] = useState(false);
  const [geoError, setGeoError] = useState<string | null>(null);
  const lastPositionSourceRef = useRef<PositionSource>("slider");

  // Geolocation - luôn watch để lấy từ Sensors (Chrome DevTools) hoặc real GPS
  useEffect(() => {
    if (!autoGuide) return;
    if (!navigator.geolocation) {
      setGeoError("Trình duyệt không hỗ trợ GPS");
      return;
    }

    const watcher = navigator.geolocation.watchPosition(
      (pos) => {
        setGeoEnabled(true);
        setGeoError(null);
        const newPos = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        lastPositionSourceRef.current = "gps";
        onPositionUpdate(newPos, "gps");
      },
      (err) => {
        // Nếu đang ở chế độ mock và có lỗi, fallback về slider
        if (mockGps && mockLat != null && mockLng != null) {
          onPositionUpdate({ lat: mockLat, lng: mockLng }, "slider");
          setGeoEnabled(true);
          setGeoError(null);
        } else {
          setGeoEnabled(false);
          setGeoError(err.message || "Không thể lấy vị trí");
        }
      },
      { enableHighAccuracy: true, maximumAge: 5000, timeout: 10000 }
    );

    return () => navigator.geolocation.clearWatch(watcher);
  }, [autoGuide, mockGps, mockLat, mockLng, onPositionUpdate]);

  return { geoEnabled, geoError, lastPositionSourceRef };
};
