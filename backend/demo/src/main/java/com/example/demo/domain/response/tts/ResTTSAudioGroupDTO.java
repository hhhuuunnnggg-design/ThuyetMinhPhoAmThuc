package com.example.demo.domain.response.tts;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;

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
public class ResTTSAudioGroupDTO {
    Long id;
    String groupKey;

    // ===== THÔNG TIN ẨM THỰC =====
    String foodName;
    BigDecimal price;
    String description;
    String imageUrl;

    // ===== VỊ TRÍ GPS =====
    Double latitude;
    Double longitude;
    Float accuracy;

    // ===== GEOFENCE =====
    Float triggerRadiusMeters;
    Integer priority;

    // ===== TEXT & VOICE GỐC =====
    String originalText;
    String originalVoice;
    Float originalSpeed;
    Integer originalFormat;
    Boolean originalWithoutFilter;

    // ===== USER & TIME =====
    String createdBy;
    Instant createdAt;
    Instant updatedAt;

    // ===== DANH SÁCH AUDIO =====
    List<ResMultilingualAudioDTO.AudioEntry> audios;
}
