import { useCallback, useEffect, useRef, useState } from "react";
import * as Location from "expo-location";
import { geofenceEngine, POIGeofence } from "../utils/geoEngine";
import { NearbyPOI } from "../types";

export type PositionSource = "gps" | "mock";

interface UseGeofenceProps {
  pois: NearbyPOI[];
  mockEnabled: boolean;
  mockLat: number | null;
  mockLng: number | null;
  autoGuide: boolean;
  onPOIEnter?: (geofence: POIGeofence) => void;
  /** Rời POI: {@code toPoiId} là POI đích khi chuyển thẳng sang POI khác; null nếu không còn trong vùng nào. */
  onPOIExit?: (fromPoiId: number, toPoiId: number | null) => void;
}

export interface GeofenceState {
  currentPOI: POIGeofence | null;
  nearbyPOIs: POIGeofence[];
  source: PositionSource;
  mockEnabled: boolean;
}

export const useGeofence = ({
  pois,
  mockEnabled,
  mockLat,
  mockLng,
  autoGuide,
  onPOIEnter,
  onPOIExit,
}: UseGeofenceProps) => {
  const [state, setState] = useState<GeofenceState>({
    currentPOI: null,
    nearbyPOIs: [],
    source: "mock",
    mockEnabled: true,
  });

  const locationSubRef = useRef<Location.LocationSubscription | null>(null);
  const lastPoiIdRef = useRef<number | null>(null);

  const evaluatePosition = useCallback(
    (lat: number, lng: number, source: PositionSource) => {
      const allInside = geofenceEngine.findAllInside(lat, lng, pois);
      const closest = geofenceEngine.checkGeofences(lat, lng, pois);

      setState((prev) => {
        const prevPoiId = prev.currentPOI?.poi.id ?? null;
        const newPoiId = closest?.poi.id ?? null;

        // POI Exit (kèm POI đích để tránh gọi stop server khi chuyển A→B — start sẽ thay phiên)
        if (prevPoiId !== null && prevPoiId !== newPoiId) {
          onPOIExit?.(prevPoiId, newPoiId);
        }

        // POI Enter
        if (newPoiId !== null && newPoiId !== prevPoiId) {
          onPOIEnter?.(closest!);
        }

        lastPoiIdRef.current = newPoiId;

        return {
          currentPOI: closest,
          nearbyPOIs: allInside,
          source,
          mockEnabled,
        };
      });
    },
    [pois, onPOIEnter, onPOIExit, mockEnabled]
  );

  // Theo dõi GPS thực
  useEffect(() => {
    if (!autoGuide || mockEnabled) {
      // Dùng mock → dùng mockLat/mockLng
      if (mockLat != null && mockLng != null) {
        evaluatePosition(mockLat, mockLng, "mock");
      }
      return;
    }

    let cancelled = false;

    const startWatching = async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") return;
      if (cancelled) return;

      locationSubRef.current = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.High,
          timeInterval: 3000,
          distanceInterval: 5,
        },
        (location) => {
          if (cancelled) return;
          evaluatePosition(
            location.coords.latitude,
            location.coords.longitude,
            "gps"
          );
        }
      );
    };

    startWatching();

    return () => {
      cancelled = true;
      locationSubRef.current?.remove();
      locationSubRef.current = null;
    };
  }, [autoGuide, mockEnabled, evaluatePosition]);

  // Cập nhật khi mock position thay đổi
  useEffect(() => {
    if (!mockEnabled || mockLat == null || mockLng == null) return;
    evaluatePosition(mockLat, mockLng, "mock");
  }, [mockLat, mockLng, mockEnabled, evaluatePosition]);

  return state;
};
