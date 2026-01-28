import type { TTSAudio } from "@/api/tts.api";
import { useEffect, useMemo, useState } from "react";
import { GeoPosition } from "../types";
import { haversineDistance } from "../utils/geo";

export const useMapPosition = (audios: TTSAudio[]) => {
  const [mockLat, setMockLat] = useState<number | null>(null);
  const [mockLng, setMockLng] = useState<number | null>(null);
  const [latRange, setLatRange] = useState<{ min: number; max: number } | null>(null);
  const [lngRange, setLngRange] = useState<{ min: number; max: number } | null>(null);
  const [position, setPosition] = useState<GeoPosition | null>(null);

  // Tính range cho slider giả lập từ danh sách quán có toạ độ
  useEffect(() => {
    const withCoords = audios.filter(
      (a) => a.latitude != null && a.longitude != null
    );
    if (withCoords.length === 0) return;

    const lats = withCoords.map((a) => a.latitude!) as number[];
    const lngs = withCoords.map((a) => a.longitude!) as number[];

    const padding = 0.0005; // ~55m
    setLatRange({
      min: Math.min(...lats) - padding,
      max: Math.max(...lats) + padding,
    });
    setLngRange({
      min: Math.min(...lngs) - padding,
      max: Math.max(...lngs) + padding,
    });

    // Khởi tạo vị trí giả lập ở quán đầu tiên
    if (mockLat == null || mockLng == null) {
      setMockLat(withCoords[0].latitude!);
      setMockLng(withCoords[0].longitude!);
      setPosition({
        lat: withCoords[0].latitude!,
        lng: withCoords[0].longitude!,
      });
    }
  }, [audios, mockLat, mockLng]);

  const sortedAudios = useMemo(() => {
    if (audios.length === 0) return [];
    if (!position) return audios;

    return [...audios].sort((a, b) => {
      const distA =
        a.latitude != null && a.longitude != null
          ? haversineDistance(position, { lat: a.latitude, lng: a.longitude })
          : Number.POSITIVE_INFINITY;
      const distB =
        b.latitude != null && b.longitude != null
          ? haversineDistance(position, { lat: b.latitude, lng: b.longitude })
          : Number.POSITIVE_INFINITY;
      return distA - distB;
    });
  }, [audios, position]);

  return {
    mockLat,
    setMockLat,
    mockLng,
    setMockLng,
    latRange,
    lngRange,
    position,
    setPosition,
    sortedAudios,
  };
};
