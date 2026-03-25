package com.example.demo.domain.response.app;

import java.time.Instant;

import lombok.AccessLevel;
import lombok.Builder;
import lombok.Data;
import lombok.experimental.FieldDefaults;

@Data
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class ResActiveNarrationDTO {

    Long id;
    String deviceId;
    Long poiId;
    String poiName;
    Long audioId;
    String languageCode;
    Instant startedAt;
    Instant estimatedEndAt;
    String status;
    Double latitude;
    Double longitude;
}
