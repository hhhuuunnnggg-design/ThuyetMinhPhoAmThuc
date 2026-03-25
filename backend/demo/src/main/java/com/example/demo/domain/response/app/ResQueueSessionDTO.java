package com.example.demo.domain.response.app;

import java.time.Instant;

import lombok.AccessLevel;
import lombok.Builder;
import lombok.Data;
import lombok.experimental.FieldDefaults;

@Data
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class ResQueueSessionDTO {

    Long id;
    String deviceId;
    Long poiId;
    String poiName;
    Instant enteredAt;
    Instant exitedAt;
    Long totalListeningTime;
    Integer audioCount;
    Boolean isPaid;
    Long paymentId;
}
