package com.example.demo.domain.response.tts;

import java.math.BigDecimal;
import java.time.Instant;

import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.experimental.FieldDefaults;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class ResTTSAudioDTO {

    Long id;
    Long groupId;
    String groupKey;

    String languageCode;
    String text;
    String translatedText;
    String voice;
    Float speed;
    Integer format;
    Boolean withoutFilter;
    String fileName;
    String s3Url;
    Long fileSize;
    String mimeType;
    Instant createdAt;
    Instant updatedAt;

    // ===== THÔNG TIN ẨM THỰC (từ POI liên kết với TTSAudioGroup) =====
    String foodName;
    BigDecimal price;
    String description;
    String imageUrl;

    // ===== GPS — từ POI liên kết =====
    Double latitude;
    Double longitude;
    Float accuracy;
    Float triggerRadiusMeters;
    Integer priority;

    // ===== TEXT GỐC (từ Group) =====
    String originalText;
    String originalVoice;

    // ===== USER INFO (từ POI) =====
    Long userId;
    String userEmail;
    String userFullName;
    String userAvatar;
    String createdBy;
}
