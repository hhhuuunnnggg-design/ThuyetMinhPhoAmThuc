import type { TTSAudio } from "@/api/tts.api";
import { config } from "@/config";
import { API_ENDPOINTS } from "@/constants";
import { message } from "antd";
import { useEffect, useRef, useState } from "react";
import { GeoPosition } from "../types";
import { haversineDistance } from "../utils/geo";

interface UseAudioPlayerProps {
  selected: TTSAudio | null;
  position: GeoPosition | null;
  autoPlayAudioId?: number | null; // Audio ID để phát tự động từ Narration Engine
}

export const useAudioPlayer = ({ selected, position, autoPlayAudioId }: UseAudioPlayerProps) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [userPaused, setUserPaused] = useState(false); // Track nếu user đã pause thủ công
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const playAudio = (audioId: number, isAutoPlay: boolean = false) => {
    // Nếu user đã pause thủ công và đây là auto-play → không phát
    if (userPaused && isAutoPlay) {
      return;
    }

    const src = `${config.api.baseURL}${API_ENDPOINTS.TTS.AUDIO_DOWNLOAD(audioId)}`;
    if (!audioRef.current) return;

    audioRef.current.src = src;
    audioRef.current
      .play()
      .then(() => {
        setIsPlaying(true);
        setUserPaused(false); // Reset khi phát thành công
      })
      .catch((err) => {
        console.error(err);
        message.error("Không thể phát audio");
      });
  };

  const handlePlayPause = () => {
    if (!selected) return;
    if (!audioRef.current) return;

    if (!isPlaying) {
      // User bấm play → reset userPaused và phát
      setUserPaused(false);
      playAudio(selected.id, false);
    } else {
      // User bấm pause → đánh dấu là user pause thủ công
      audioRef.current.pause();
      setIsPlaying(false);
      setUserPaused(true);
    }
  };

  // Auto-play khi Narration Engine yêu cầu
  useEffect(() => {
    if (autoPlayAudioId && !isPlaying && !userPaused) {
      playAudio(autoPlayAudioId, true); // true = auto-play
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoPlayAudioId]);

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
