import { useEffect, useRef } from "react";
import { useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet.heat";

interface HeatmapLayerProps {
  points: [number, number, number][]; // [lat, lng, intensity]
}

export const HeatmapLayer = ({ points }: HeatmapLayerProps) => {
  const heatRef = useRef<ReturnType<typeof L.heatLayer> | null>(null);
  const map = useMap();

  useEffect(() => {
    if (!map) return;

    if (heatRef.current) {
      map.removeLayer(heatRef.current);
      heatRef.current = null;
    }

    if (points.length === 0) return;

    heatRef.current = L.heatLayer(points, {
      radius: 40,
      blur: 25,
      maxZoom: 19,
      max: 1.0,
      gradient: {
        0.0: "#22c55e",   // xanh — ít người
        0.4: "#facc15",   // vàng — vừa
        0.7: "#f97316",    // cam — đông
        1.0: "#ef4444",   // đỏ — rất đông
      },
    });

    heatRef.current.addTo(map);

    return () => {
      if (heatRef.current) {
        map.removeLayer(heatRef.current);
        heatRef.current = null;
      }
    };
  }, [map, points]);

  return null;
};
