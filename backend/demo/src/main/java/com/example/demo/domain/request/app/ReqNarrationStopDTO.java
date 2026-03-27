package com.example.demo.domain.request.app;

import lombok.AccessLevel;
import lombok.Data;
import lombok.experimental.FieldDefaults;

@Data
@FieldDefaults(level = AccessLevel.PRIVATE)
public class ReqNarrationStopDTO {

    /**
     * COMPLETED (phát hết), SKIPPED (người dùng dừng), EXPIRED (rời vùng POI / hết hạn).
     * Mặc định EXPIRED nếu bỏ trống.
     */
    String status;
}
