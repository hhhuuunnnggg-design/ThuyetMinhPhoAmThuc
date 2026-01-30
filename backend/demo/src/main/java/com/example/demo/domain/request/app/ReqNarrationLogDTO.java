package com.example.demo.domain.request.app;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AccessLevel;
import lombok.Data;
import lombok.experimental.FieldDefaults;

@Data
@FieldDefaults(level = AccessLevel.PRIVATE)
public class ReqNarrationLogDTO {

    @NotBlank
    String deviceId;

    @NotNull
    Long ttsAudioId;

    /**
     * Thời điểm bắt đầu phát, epoch millis.
     */
    @NotNull
    Long playedAt;

    /**
     * Thời lượng phát (giây), optional.
     */
    Integer durationSeconds;

    /**
     * STARTED, COMPLETED, SKIPPED...
     */
    String status;
}

