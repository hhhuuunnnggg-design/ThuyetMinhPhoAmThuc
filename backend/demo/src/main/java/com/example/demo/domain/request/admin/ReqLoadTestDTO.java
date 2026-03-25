package com.example.demo.domain.request.admin;

import jakarta.validation.constraints.NotNull;
import lombok.AccessLevel;
import lombok.Data;
import lombok.experimental.FieldDefaults;

@Data
@FieldDefaults(level = AccessLevel.PRIVATE)
public class ReqLoadTestDTO {

    @NotNull(message = "Số concurrent users không được để trống")
    Integer concurrentUsers;

    @NotNull(message = "Thời gian chạy (giây) không được để trống")
    Integer durationSeconds;

    /**
     * Bán kính trigger (mét). Mặc định 50m.
     */
    Integer triggerRadiusMeters = 50;

    /**
     * Số POI tham gia test. Mặc định dùng tất cả.
     */
    Integer poiCount;
}
