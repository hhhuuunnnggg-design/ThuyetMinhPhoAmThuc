package com.example.demo.domain.response.app;

import java.time.Instant;
import java.util.Map;

import com.example.demo.domain.DeviceConfig.RunningMode;

import lombok.AccessLevel;
import lombok.Builder;
import lombok.Data;
import lombok.experimental.FieldDefaults;

@Data
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class ResDeviceConfigDTO {

    Long id;
    String deviceId;
    RunningMode runningMode;
    Boolean offlineModeEnabled;
    Instant lastSyncAt;
    String downloadedVersions;
    Integer appVersionCode;
    Long totalDownloadedMB;
    Instant lastSeenAt;

    /**
     * Danh sách POI cần sync (id → version mới nhất).
     * App sẽ so sánh với bản local để download bundle cần thiết.
     */
    Map<Long, Integer> poisNeedingSync;
}
