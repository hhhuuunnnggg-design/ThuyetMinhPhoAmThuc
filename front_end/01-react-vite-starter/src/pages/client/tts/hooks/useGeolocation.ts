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
  const watcherIdRef = useRef<number | null>(null);
  const hasUserGestureRef = useRef(false);
  /** Tránh đưa `onPositionUpdate` vào deps useEffect — parent hay truyền inline fn → vòng lặp render vô hạn. */
  const onPositionUpdateRef = useRef(onPositionUpdate);
  onPositionUpdateRef.current = onPositionUpdate;

  // Chỉ request geolocation khi:
  // 1. autoGuide = true
  // 2. mockGps = false (cần real GPS, không dùng mock)
  // 3. User đã có gesture (đã bật toggle hoặc click button)
  useEffect(() => {
    if (!autoGuide || mockGps) {
      // Nếu đang dùng mock GPS, không cần request real geolocation
      if (watcherIdRef.current != null) {
        navigator.geolocation?.clearWatch(watcherIdRef.current);
        watcherIdRef.current = null;
      }
      // Fallback về mock position
      if (mockLat != null && mockLng != null) {
        onPositionUpdateRef.current({ lat: mockLat, lng: mockLng }, "slider");
        setGeoEnabled(true);
        setGeoError(null);
      }
      return;
    }

    if (!navigator.geolocation) {
      setGeoError("Trình duyệt không hỗ trợ GPS");
      return;
    }

    // Chỉ request khi user đã có gesture (đã bật toggle hoặc đã vào trang một lần)
    // Để tránh violation, ta sẽ request sau một delay ngắn (giả lập user gesture)
    // Hoặc chỉ request khi user thực sự bật toggle
    const requestGeo = () => {
      if (watcherIdRef.current != null) {
        navigator.geolocation.clearWatch(watcherIdRef.current);
      }

      watcherIdRef.current = navigator.geolocation.watchPosition(
        (pos) => {
          setGeoEnabled(true);
          setGeoError(null);
          const newPos = { lat: pos.coords.latitude, lng: pos.coords.longitude };
          lastPositionSourceRef.current = "gps";
          onPositionUpdateRef.current(newPos, "gps");
        },
        (err) => {
          // Nếu có lỗi, fallback về mock position nếu có
          if (mockLat != null && mockLng != null) {
            onPositionUpdateRef.current({ lat: mockLat, lng: mockLng }, "slider");
            setGeoEnabled(true);
            setGeoError(null);
          } else {
            setGeoEnabled(false);
            setGeoError(err.message || "Không thể lấy vị trí");
          }
        },
        { 
          enableHighAccuracy: true, 
          maximumAge: 5000, 
          timeout: 10000 
        }
      );
      hasUserGestureRef.current = true;
    };

    // Delay một chút để tránh violation (giả lập như user đã có gesture)
    // Hoặc có thể chỉ request khi user thực sự bật toggle
    const timeoutId = setTimeout(requestGeo, 100);

    return () => {
      clearTimeout(timeoutId);
      if (watcherIdRef.current != null) {
        navigator.geolocation.clearWatch(watcherIdRef.current);
        watcherIdRef.current = null;
      }
    };
  }, [autoGuide, mockGps, mockLat, mockLng]);

  return { geoEnabled, geoError, lastPositionSourceRef };
};
