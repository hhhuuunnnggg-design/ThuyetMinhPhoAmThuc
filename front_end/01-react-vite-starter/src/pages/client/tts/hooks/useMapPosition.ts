import type { TTSAudio } from "@/api/tts.api";
import { useEffect, useMemo, useRef, useState } from "react";
import { GeoPosition } from "../types";
import { haversineDistance } from "../utils/geo";

export const useMapPosition = (audios: TTSAudio[]) => {
  const [position, setPosition] = useState<GeoPosition | null>(null);
  const [latRange, setLatRange] = useState<{ min: number; max: number } | null>(null);
  const [lngRange, setLngRange] = useState<{ min: number; max: number } | null>(null);

  const initializedRef = useRef(false);

  useEffect(() => {
    const withCoords = audios.filter(
      (a) => a.latitude != null && a.longitude != null
    );
    if (withCoords.length === 0) return;

    const lats = withCoords.map((a) => a.latitude!) as number[];
    const lngs = withCoords.map((a) => a.longitude!) as number[];

    const padding = 0.0005;
    setLatRange({
      min: Math.min(...lats) - padding,
      max: Math.max(...lats) + padding,
    });
    setLngRange({
      min: Math.min(...lngs) - padding,
      max: Math.max(...lngs) + padding,
    });

    if (!initializedRef.current) {
      initializedRef.current = true;
      setPosition({
        lat: withCoords[0].latitude!,
        lng: withCoords[0].longitude!,
      });
    }
  }, [audios]);

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
    position,
    setPosition,
    latRange,
    lngRange,
    sortedAudios,
  };
};
