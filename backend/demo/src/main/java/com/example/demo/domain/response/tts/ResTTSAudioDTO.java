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

    // ===== GROUP INFO =====
    Long groupId;
    String groupKey;

    // ===== NGÔN NGỮ =====
    String languageCode; // vi, en, zh, ja, ko, fr

    // ===== NỘI DUNG =====
    String text;
    String voice;
    Float speed;
    Integer format;
    Boolean withoutFilter;

    // ===== FILE INFO =====
    String fileName;
    String s3Url;
    Long fileSize;
    String mimeType;

    // ===== THỜI GIAN =====
    Instant createdAt;
    Instant updatedAt;
    String createdBy;

    // ===== THÔNG TIN ẨM THỰC (từ Group) =====
    String foodName;
    BigDecimal price;
    String description;
    String imageUrl;

    // ===== VỊ TRÍ GPS (từ Group) =====
    Double latitude;
    Double longitude;
    Float accuracy;

    // ===== GEOFENCE (từ Group) =====
    Float triggerRadiusMeters;
    Integer priority;

    // ===== TEXT GỐC (từ Group) =====
    String originalText;  // Text tiếng Việt gốc
    String originalVoice; // Voice tiếng Việt gốc

    // ===== USER INFO (từ Group) =====
    Long userId;
    String userEmail;
    String userFullName;
    String userAvatar;
}
