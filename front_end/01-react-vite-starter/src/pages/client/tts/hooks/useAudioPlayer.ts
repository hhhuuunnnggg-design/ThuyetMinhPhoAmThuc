import { logNarrationAPI } from "@/api/app.api";
import type { TTSAudio } from "@/api/tts.api";
import axios from "@/api/axios";
import { API_ENDPOINTS } from "@/constants";
import { message } from "antd";
import { useCallback, useEffect, useRef, useState } from "react";
import { GeoPosition } from "../types";
import { haversineDistance } from "../utils/geo";

interface UseAudioPlayerProps {
  selected: TTSAudio | null;
  position: GeoPosition | null;
  autoPlayAudioId?: number | null;
  deviceId?: string;
  useBackendLogging?: boolean;
  playbackLanguageCode?: string;
}

export const useAudioPlayer = ({
  selected,
  position,
  autoPlayAudioId,
  deviceId,
  useBackendLogging = false,
  playbackLanguageCode = "vi",
}: UseAudioPlayerProps) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [userPaused, setUserPaused] = useState(false);
  const [audioDuration, setAudioDuration] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const currentPlayingAudioIdRef = useRef<number | null>(null);
  const playStartTimeRef = useRef<number | null>(null);
  const blobUrlRef = useRef<string | null>(null);

  const revokeBlobUrl = () => {
    if (blobUrlRef.current) {
      URL.revokeObjectURL(blobUrlRef.current);
      blobUrlRef.current = null;
    }
  };

  /**
   * Tải qua axios (có Bearer) → blob → object URL.
   * Tránh <audio src="cross-origin"> không gửi JWT / CORS chặn media.
   */
  const playAudioInternal = useCallback(
    async (audioId: number, isAutoPlay: boolean, langExplicit?: string, groupKey?: string) => {
      if (userPaused && isAutoPlay) {
        return;
      }
      if (!audioRef.current) return;

      const lang = (langExplicit ?? playbackLanguageCode ?? "vi").toLowerCase();

      revokeBlobUrl();

      // Ưu tiên groupKey (chắc chắn đúng group), fallback qua audio ID
      const url = groupKey
        ? API_ENDPOINTS.TTS.GROUP_AUDIO(groupKey, lang)
        : API_ENDPOINTS.TTS.AUDIO_STREAM(audioId, lang);

      try {
        const blob = (await axios.get(url, { responseType: "blob" })) as unknown as Blob;

        if (!blob || blob.size === 0) {
          message.error("File audio trống hoặc chưa có trên server");
          return;
        }

        if (blob.type && blob.type.includes("json")) {
          message.error("API trả lỗi thay vì file audio — kiểm tra backend / ngôn ngữ");
          return;
        }

        const objectUrl = URL.createObjectURL(blob);
        blobUrlRef.current = objectUrl;

        const el = audioRef.current;
        el.src = objectUrl;
        await el.play();

        setIsPlaying(true);
        setUserPaused(false);
        currentPlayingAudioIdRef.current = audioId;
        playStartTimeRef.current = Date.now();
        setAudioDuration(0);

        if (useBackendLogging && deviceId && playStartTimeRef.current) {
          logNarrationAPI({
            deviceId,
            ttsAudioId: audioId,
            playedAt: playStartTimeRef.current,
            status: "PLAYING",
          }).catch(() => {});
        }
      } catch {
        message.error(
          "Không thể tải/phát audio — kiểm tra backend đang chạy và đã có file cho ngôn ngữ này",
        );
      }
    },
    [userPaused, playbackLanguageCode, useBackendLogging, deviceId],
  );

  /** Đổi ngôn ngữ + phát ngay (truyền lang rõ ràng, không phụ thuộc setState). */
  const playAudioForLanguage = useCallback(
    (audioId: number, lang: string, groupKey?: string) => {
      void playAudioInternal(audioId, false, lang, groupKey);
    },
    [playAudioInternal],
  );

  const handlePlayPause = () => {
    if (!selected) return;
    if (!audioRef.current) return;

    if (!isPlaying) {
      setUserPaused(false);
      void playAudioInternal(selected.id, false, undefined, selected.groupKey);
    } else {
      audioRef.current.pause();
      setIsPlaying(false);
      setUserPaused(true);

      if (useBackendLogging && deviceId && currentPlayingAudioIdRef.current && playStartTimeRef.current) {
        const duration = Math.round((Date.now() - playStartTimeRef.current) / 1000);
        logNarrationAPI({
          deviceId,
          ttsAudioId: currentPlayingAudioIdRef.current,
          playedAt: playStartTimeRef.current,
          durationSeconds: duration,
          status: "SKIPPED",
        }).catch(() => {});
        currentPlayingAudioIdRef.current = null;
        playStartTimeRef.current = null;
      }
    }
  };

  useEffect(() => {
    if (autoPlayAudioId && !isPlaying && !userPaused) {
      void playAudioInternal(autoPlayAudioId, true);
    }
  }, [autoPlayAudioId, isPlaying, userPaused, playAudioInternal]);

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
        }).catch(() => {});
        currentPlayingAudioIdRef.current = null;
        playStartTimeRef.current = null;
      }
    }
  }, [isPlaying, position, selected, useBackendLogging, deviceId]);

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

        logNarrationAPI({
          deviceId,
          ttsAudioId: currentPlayingAudioIdRef.current,
          playedAt: playStartTimeRef.current,
          durationSeconds: duration,
          status: "COMPLETED",
        }).catch(() => {});

        currentPlayingAudioIdRef.current = null;
        playStartTimeRef.current = null;
      }
    };

    audioElement.addEventListener("ended", handleEnded);
    return () => {
      audioElement.removeEventListener("ended", handleEnded);
    };
  }, [useBackendLogging, deviceId]);

  useEffect(() => {
    if (!audioRef.current) return;
    const audio = audioRef.current;
    const handleLoadedMetadata = () => {
      setAudioDuration(audio.duration || 0);
    };
    audio.addEventListener("loadedmetadata", handleLoadedMetadata);
    return () => audio.removeEventListener("loadedmetadata", handleLoadedMetadata);
  }, []);

  useEffect(() => {
    return () => {
      revokeBlobUrl();
    };
  }, []);

  return {
    isPlaying,
    setIsPlaying,
    audioRef,
    handlePlayPause,
    audioDuration,
    playAudioForLanguage,
  };
};
