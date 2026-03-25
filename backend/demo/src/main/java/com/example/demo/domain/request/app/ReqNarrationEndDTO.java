package com.example.demo.domain.request.app;

import jakarta.validation.constraints.NotNull;
import lombok.AccessLevel;
import lombok.Data;
import lombok.experimental.FieldDefaults;

@Data
@FieldDefaults(level = AccessLevel.PRIVATE)
public class ReqNarrationEndDTO {

    @NotNull(message = "activeNarrationId không được để trống")
    Long activeNarrationId;

    /**
     * Thời lượng thực tế đã phát (giây).
     */
    Integer actualDurationSeconds;

    /**
     * Trạng thái kết thúc: COMPLETED, SKIPPED, EXPIRED.
     */
    String status;
}
