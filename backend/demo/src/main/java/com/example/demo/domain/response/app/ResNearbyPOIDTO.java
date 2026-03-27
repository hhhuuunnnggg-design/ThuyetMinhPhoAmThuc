package com.example.demo.domain.response.app;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.Map;

import lombok.AccessLevel;
import lombok.Builder;
import lombok.Data;
import lombok.experimental.FieldDefaults;

@Data
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class ResNearbyPOIDTO {

    Long id;
    Long groupId;
    String groupKey;
    String foodName;
    String imageUrl;

    /**
     * Cùng cấu trúc với {@link ResPOIDTO#getAudios()} — app cần để phát TTS / narration/start.
     */
    Map<String, ResPOIDTO.ResAudioInfoDTO> audios;

    Double latitude;
    Double longitude;
    Float triggerRadiusMeters;
    Integer priority;
    BigDecimal price;
    String category;
    String address;

    /**
     * Khoảng cách từ vị trí user (mét).
     */
    Double distanceMeters;

    /**
     * Số người đang nghe audio này ngay lúc này.
     */
    int activeListenerCount;

    /**
     * POI có audio đã được download offline chưa.
     */
    boolean downloadedOffline;
}
