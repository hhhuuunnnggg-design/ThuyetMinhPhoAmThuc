import type { TTSAudio } from "@/api/tts.api";
import { config } from "@/config";
import { API_ENDPOINTS } from "@/constants";
import { message } from "antd";
import { useEffect, useRef, useState } from "react";
import { GeoPosition } from "../types";
import { haversineDistance } from "../utils/geo";

export const useAudioPlayer = (selected: TTSAudio | null, position: GeoPosition | null) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const handlePlayPause = () => {
    if (!selected) return;
    const src = `${config.api.baseURL}${API_ENDPOINTS.TTS.AUDIO_DOWNLOAD(selected.id)}`;
    if (!audioRef.current) return;

    if (!isPlaying) {
      audioRef.current.src = src;
      audioRef.current
        .play()
        .then(() => setIsPlaying(true))
        .catch((err) => {
          console.error(err);
          message.error("Không thể phát audio");
        });
    } else {
      audioRef.current.pause();
      setIsPlaying(false);
    }
  };

  // Dừng audio nếu đã ra khỏi bán kính kích hoạt
  useEffect(() => {
    if (!isPlaying || !position || !selected) return;
    if (selected.latitude == null || selected.longitude == null) return;

    const radius = selected.accuracy ?? 30;
    const dist = haversineDistance(position, {
      lat: selected.latitude,
      lng: selected.longitude,
    });

    if (dist > radius && audioRef.current) {
      audioRef.current.pause();
      setIsPlaying(false);
    }
  }, [isPlaying, position, selected]);

  return { isPlaying, setIsPlaying, audioRef, handlePlayPause };
};
