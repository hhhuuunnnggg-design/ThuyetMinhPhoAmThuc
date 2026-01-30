package com.example.demo.domain.response.app;

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
public class ResNarrationLogDTO {
    Long id;
    String deviceId;
    Long ttsAudioId;
    String ttsAudioName; // Tên POI (foodName hoặc text)
    Instant playedAt;
    Integer durationSeconds;
    String status;
    Instant createdAt;
}
