import type { TTSAudio } from "@/api/tts.api";
import { logNarrationAPI } from "@/api/app.api";
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
  deviceId?: string; // Device ID để ghi log narration
  useBackendLogging?: boolean; // Có ghi log lên backend không
}

export const useAudioPlayer = ({ 
  selected, 
  position, 
  autoPlayAudioId,
  deviceId,
  useBackendLogging = false,
}: UseAudioPlayerProps) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [userPaused, setUserPaused] = useState(false); // Track nếu user đã pause thủ công
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const currentPlayingAudioIdRef = useRef<number | null>(null);
  const playStartTimeRef = useRef<number | null>(null);

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
        currentPlayingAudioIdRef.current = audioId;
        playStartTimeRef.current = Date.now();
        
        // Ghi log khi bắt đầu phát (nếu dùng backend logging)
        if (useBackendLogging && deviceId) {
          console.log("📝 Logging narration start:", { deviceId, audioId, playedAt: playStartTimeRef.current });
          logNarrationAPI({
            deviceId,
            ttsAudioId: audioId,
            playedAt: playStartTimeRef.current,
            status: "PLAYING",
          })
            .then(() => {
              console.log("✅ Logged narration start successfully");
            })
            .catch((err) => {
              console.error("❌ Failed to log narration start:", err);
            });
        } else {
          console.warn("⚠️ Not logging narration:", { useBackendLogging, deviceId });
        }
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
      playAudio(selected.id, false); // false = manual play, nhưng vẫn ghi log nếu useBackendLogging = true
    } else {
      // User bấm pause → đánh dấu là user pause thủ công
      audioRef.current.pause();
      setIsPlaying(false);
      setUserPaused(true);
      
      // Ghi log khi user pause thủ công (nếu đang phát)
      if (useBackendLogging && deviceId && currentPlayingAudioIdRef.current && playStartTimeRef.current) {
        const duration = Math.round((Date.now() - playStartTimeRef.current) / 1000);
        logNarrationAPI({
          deviceId,
          ttsAudioId: currentPlayingAudioIdRef.current,
          playedAt: playStartTimeRef.current,
          durationSeconds: duration,
          status: "SKIPPED",
        }).catch((err) => {
          console.warn("Failed to log narration pause:", err);
        });
        currentPlayingAudioIdRef.current = null;
        playStartTimeRef.current = null;
      }
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

    const radius = selected.triggerRadiusMeters ?? selected.accuracy ?? 30;
    const dist = haversineDistance(position, {
      lat: selected.latitude,
      lng: selected.longitude,
    });

    if (dist > radius && audioRef.current) {
      audioRef.current.pause();
      setIsPlaying(false);
      
      // Ghi log khi bị dừng do ra khỏi bán kính
      if (useBackendLogging && deviceId && currentPlayingAudioIdRef.current) {
        const duration = playStartTimeRef.current 
          ? Math.round((Date.now() - playStartTimeRef.current) / 1000)
          : undefined;
        logNarrationAPI({
          deviceId,
          ttsAudioId: currentPlayingAudioIdRef.current,
          playedAt: playStartTimeRef.current || Date.now(),
          durationSeconds: duration,
          status: "SKIPPED",
        }).catch((err) => {
          console.warn("Failed to log narration skip:", err);
        });
        currentPlayingAudioIdRef.current = null;
        playStartTimeRef.current = null;
      }
    }
  }, [isPlaying, position, selected, useBackendLogging, deviceId]);

  // Ghi log khi audio phát xong
  useEffect(() => {
    if (!useBackendLogging || !deviceId || !audioRef.current) return;

    const audioElement = audioRef.current;

    const handleEnded = () => {
      if (currentPlayingAudioIdRef.current && playStartTimeRef.current) {
        const duration = audioElement.duration 
          ? Math.round(audioElement.duration)
          : playStartTimeRef.current 
            ? Math.round((Date.now() - playStartTimeRef.current) / 1000)
            : undefined;

        console.log("📝 Logging narration complete:", { 
          deviceId, 
          audioId: currentPlayingAudioIdRef.current, 
          duration 
        });
        logNarrationAPI({
          deviceId,
          ttsAudioId: currentPlayingAudioIdRef.current,
          playedAt: playStartTimeRef.current,
          durationSeconds: duration,
          status: "COMPLETED",
        })
          .then(() => {
            console.log("✅ Logged narration complete successfully");
          })
          .catch((err) => {
            console.error("❌ Failed to log narration complete:", err);
          });

        currentPlayingAudioIdRef.current = null;
        playStartTimeRef.current = null;
      }
    };

    audioElement.addEventListener("ended", handleEnded);
    return () => {
      audioElement.removeEventListener("ended", handleEnded);
    };
  }, [useBackendLogging, deviceId]);

  return { isPlaying, setIsPlaying, audioRef, handlePlayPause };
};
