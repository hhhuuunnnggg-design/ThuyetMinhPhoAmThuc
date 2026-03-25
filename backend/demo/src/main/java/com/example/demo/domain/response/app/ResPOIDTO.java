package com.example.demo.domain.response.app;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.Map;

import com.example.demo.domain.TTSAudioGroup;

import lombok.AccessLevel;
import lombok.Builder;
import lombok.Data;
import lombok.experimental.FieldDefaults;

@Data
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class ResPOIDTO {

    Long id;
    Long groupId;
    String groupKey;

    // Từ TTSAudioGroup
    String foodName;
    BigDecimal price;
    String description;
    String imageUrl;
    Double latitude;
    Double longitude;
    Float accuracy;
    Float triggerRadiusMeters;
    Integer priority;
    String originalText;
    String originalVoice;

    // POI metadata
    String address;
    String category;
    String openHours;
    String phone;
    Boolean isActive;
    Long viewCount;
    Long likeCount;
    String qrCode;
    Integer version;

    // Nhà hàng
    String restaurantName;
    Boolean restaurantVerified;

    // Audio đa ngôn ngữ
    Map<String, ResAudioInfoDTO> audios;

    Instant createdAt;
    Instant updatedAt;

    @Data
    @Builder
    @FieldDefaults(level = AccessLevel.PRIVATE)
    public static class ResAudioInfoDTO {
        Long audioId;
        String languageCode;
        String languageName;
        String voice;
        Float speed;
        Integer format;
        Boolean withoutFilter;
        String s3Url;
        Long fileSize;
        String mimeType;
        Long durationSeconds;
    }

    public static ResAudioInfoDTO fromAudio(TTSAudioGroup group, String lang, ResAudioInfoDTO.ResAudioInfoDTOBuilder builder) {
        return builder.build();
    }
}
