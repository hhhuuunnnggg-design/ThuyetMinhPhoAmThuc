import { checkNarrationAPI, logNarrationAPI, type NarrationCheckResponse } from "@/api/app.api";
import type { TTSAudio } from "@/api/tts.api";
import { useEffect, useRef, useState } from "react";
import { GeofenceEngine } from "../engines/GeofenceEngine";
import { GeoPosition } from "../types";

interface UseNarrationEngineWithBackendProps {
  audios: TTSAudio[];
  position: GeoPosition | null;
  autoGuide: boolean;
  isPlaying: boolean;
  onPOIDetected: (poiId: number) => void;
  onShouldPlay: (audioId: number) => void;
  useBackend?: boolean; // Flag để bật/tắt backend API
}

/**
 * Hook quản lý Geofence và Narration Engine với backend API
 * Theo luồng hoạt động:
 * 1. Background service cập nhật vị trí (position)
 * 2. Geofence Engine xác định POI trong bán kính
 * 3. Narration Engine (backend) kiểm tra trạng thái và quyết định phát
 * 4. Ghi log lên backend để tránh lặp
 */
export const useNarrationEngineWithBackend = ({
  audios,
  position,
  autoGuide,
  isPlaying,
  onPOIDetected,
  onShouldPlay,
  useBackend = true,
}: UseNarrationEngineWithBackendProps) => {
  const lastDetectedPOIRef = useRef<number | null>(null);
  const [deviceId] = useState<string>(() => {
    // Lấy deviceId từ localStorage hoặc tạo mới
    const stored = localStorage.getItem("device_id");
    if (stored) return stored;
    const newId = `web-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    localStorage.setItem("device_id", newId);
    return newId;
  });

  useEffect(() => {
    if (!autoGuide || !position || audios.length === 0) return;

    // Chuyển đổi audios thành POIs
    const pois = audios
      .map((audio) => GeofenceEngine.audioToPOI(audio))
      .filter((poi): poi is NonNullable<typeof poi> => poi !== null);

    if (pois.length === 0) return;

    // Geofence Engine: Tìm POI gần nhất/ưu tiên cao nhất trong bán kính
    const detectedPOI = GeofenceEngine.findNearestPOI(position, pois);

    if (!detectedPOI) {
      lastDetectedPOIRef.current = null;
      return;
    }

    // Nếu POI mới được phát hiện, gửi sự kiện
    if (detectedPOI.id !== lastDetectedPOIRef.current) {
      lastDetectedPOIRef.current = detectedPOI.id;
      onPOIDetected(detectedPOI.id);
    }

    // Nếu đang phát audio khác, không làm gì
    if (isPlaying) return;

    // Narration Engine (backend): Kiểm tra trạng thái và quyết định phát
    if (useBackend) {
      checkNarrationAPI({
        deviceId,
        ttsAudioId: detectedPOI.audioId,
        clientTimestamp: Date.now(),
      })
        .then((response: any) => {
          // Response có thể là IBackendRes<NarrationCheckResponse> hoặc đã được unwrap
          let result: NarrationCheckResponse;
          if (response?.data && typeof response.data === 'object' && 'shouldPlay' in response.data) {
            // Đã unwrap, response.data chính là NarrationCheckResponse
            result = response.data;
          } else if (response && typeof response === 'object' && 'shouldPlay' in response) {
            // Response trực tiếp là NarrationCheckResponse
            result = response;
          } else {
            console.error("Invalid narration check response:", response);
            return;
          }
          
          if (result?.shouldPlay) {
            // Gửi sự kiện để phát audio
            // Log sẽ được ghi trong useAudioPlayer khi audio thực sự bắt đầu phát
            onShouldPlay(detectedPOI.audioId);
          }
        })
        .catch((err) => {
          console.error("Failed to check narration:", err);
          // Fallback: vẫn phát nếu backend lỗi (hoặc có thể không phát)
          // message.error("Không thể kiểm tra trạng thái narration");
        });
    } else {
      // Fallback: dùng logic local cũ nếu không dùng backend
      onShouldPlay(detectedPOI.audioId);
    }
  }, [autoGuide, position, audios, isPlaying, onPOIDetected, onShouldPlay, useBackend, deviceId]);

  return {
    deviceId,
  };
};

/**
 * Helper function để log narration khi audio phát xong
 */
export const logNarrationComplete = async (
  deviceId: string,
  ttsAudioId: number,
  durationSeconds?: number
) => {
  try {
    await logNarrationAPI({
      deviceId,
      ttsAudioId,
      playedAt: Date.now(),
      durationSeconds,
      status: "COMPLETED",
    });
  } catch (err) {
    console.warn("Failed to log narration complete:", err);
  }
};
