package com.example.demo.domain.request.app;

import jakarta.validation.constraints.NotBlank;
import lombok.AccessLevel;
import lombok.Data;
import lombok.experimental.FieldDefaults;

@Data
@FieldDefaults(level = AccessLevel.PRIVATE)
public class ReqDeviceSyncDTO {

    @NotBlank(message = "deviceId không được để trống")
    String deviceId;

    Double latitude;
    Double longitude;

    /**
     * JSON map: {"poiId": version, ...}
     * Gửi lên để server biết thiết bị đã có những version nào.
     */
    String downloadedVersions;
}
