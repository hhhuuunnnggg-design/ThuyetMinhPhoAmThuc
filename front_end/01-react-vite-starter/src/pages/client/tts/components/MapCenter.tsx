import { Map } from "leaflet";
import { useEffect } from "react";
import { useMap } from "react-leaflet";
import { GeoPosition } from "../types";

interface MapCenterProps {
  position: GeoPosition | null;
  hasManualPan: boolean;
  onMapReady: (map: Map) => void;
  onDragStart?: () => void;
}

export const MapCenter = ({ position, hasManualPan, onMapReady, onDragStart }: MapCenterProps) => {
  const map = useMap();

  useEffect(() => {
    onMapReady(map);
    if (onDragStart) {
      map.on("dragstart", onDragStart);
    }
  }, [map, onMapReady, onDragStart]);

  useEffect(() => {
    if (!position || hasManualPan) return;
    map.setView([position.lat, position.lng], map.getZoom(), { animate: true });
  }, [position?.lat, position?.lng, map, hasManualPan]);

  return null;
};
