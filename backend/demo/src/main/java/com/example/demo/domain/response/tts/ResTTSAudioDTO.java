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
    String text;
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
    String createdBy;

    // Thông tin thuyết minh ẩm thực
    String foodName;
    BigDecimal price;
    String description;
    String imageUrl;

    // Thông tin vị trí (GPS)
    Double latitude;
    Double longitude;
    Float accuracy;

    // Cấu hình geofence cho POI
    Float triggerRadiusMeters;
    Integer priority;
}
