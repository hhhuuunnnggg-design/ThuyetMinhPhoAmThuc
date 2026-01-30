package com.example.demo.domain.request.app;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AccessLevel;
import lombok.Data;
import lombok.experimental.FieldDefaults;

@Data
@FieldDefaults(level = AccessLevel.PRIVATE)
public class ReqNarrationCheckDTO {

    @NotBlank
    String deviceId;

    @NotNull
    Long ttsAudioId;

    /**
     * Thời điểm client chuẩn bị phát (epoch millis ở phía client),
     * nếu không gửi thì backend dùng thời gian hiện tại.
     */
    Long clientTimestamp;
}

