import {
  endNarrationAPI,
  getActiveNarrationsAPI,
  logNarrationAPI,
  startNarrationAPI,
  type ActiveNarration,
} from "@/api/app.api";
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
  const activeNarrationIdRef = useRef<number | null>(null);

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

  const resolveActiveNarrationId = useCallback(
    async (args: {
      deviceId: string;
      poiId: number;
      audioId: number;
      languageCode: string;
    }): Promise<number | null> => {
      const targetLang = args.languageCode.toLowerCase();
      for (let i = 0; i < 3; i++) {
        const res: any = await getActiveNarrationsAPI();
        const data = Array.isArray(res?.data)
          ? res.data
          : res?.data?.result || [];

        const found = (data as ActiveNarration[]).find(
          (n) =>
            n.deviceId === args.deviceId &&
            n.poiId === args.poiId &&
            n.audioId === args.audioId &&
            (n.languageCode || "").toLowerCase() === targetLang &&
            n.status === "PLAYING",
        );

        if (found?.id) return found.id;
        await new Promise((r) => setTimeout(r, 150));
      }

      return null;
    },
    [],
  );

  const endActiveNarrationIfNeeded = useCallback(
    async (status: string, durationSeconds?: number) => {
      if (!useBackendLogging || !activeNarrationIdRef.current) return;
      const id = activeNarrationIdRef.current;
      activeNarrationIdRef.current = null;
      try {
        await endNarrationAPI({
          activeNarrationId: id,
          actualDurationSeconds: durationSeconds,
          status,
        });
      } catch (e) {
        // Không làm ảnh hưởng UI phát audio, nhưng cần log để debug dashboard
        console.warn("endNarration failed:", e);
      }
    },
    [useBackendLogging],
  );

  const startActiveNarrationIfNeeded = useCallback(
    async (audioId: number, languageCode: string) => {
      if (!useBackendLogging) return;
      if (!deviceId) return;
      if (!selected) return;
      if (selected.poiId == null) return;

      try {
        await startNarrationAPI({
          deviceId,
          poiId: selected.poiId,
          audioId,
          languageCode: languageCode.toLowerCase(),
          latitude: position?.lat ?? undefined,
          longitude: position?.lng ?? undefined,
        });

        const activeId = await resolveActiveNarrationId({
          deviceId,
          poiId: selected.poiId,
          audioId,
          languageCode,
        });

        activeNarrationIdRef.current = activeId;
      } catch (e) {
        // Không làm ảnh hưởng UI phát audio, nhưng cần log để debug dashboard
        console.warn("startNarration failed:", e);
      }
    },
    [deviceId, position, resolveActiveNarrationId, selected, useBackendLogging],
  );

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

        // Tạo ActiveNarration để Dashboard Real-time có dữ liệu.
        if (useBackendLogging) {
          void startActiveNarrationIfNeeded(audioId, lang);
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
      void playAudioInternal(selected.id, false, undefined, selected.groupKey ?? undefined);
    } else {
      const duration = playStartTimeRef.current
        ? Math.round((Date.now() - playStartTimeRef.current) / 1000)
        : undefined;

      audioRef.current.pause();
      setIsPlaying(false);
      setUserPaused(true);

      if (useBackendLogging && deviceId && currentPlayingAudioIdRef.current && playStartTimeRef.current) {
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

      void endActiveNarrationIfNeeded("SKIPPED", duration);
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

      void endActiveNarrationIfNeeded("SKIPPED");
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

          void endActiveNarrationIfNeeded("COMPLETED", duration);
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
