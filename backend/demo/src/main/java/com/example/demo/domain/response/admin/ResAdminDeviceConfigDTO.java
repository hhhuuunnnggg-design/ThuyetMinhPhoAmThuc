package com.example.demo.domain.response.admin;

import java.time.Instant;

import com.example.demo.domain.DeviceConfig.NetworkType;
import com.example.demo.domain.DeviceConfig.RunningMode;

import lombok.AccessLevel;
import lombok.Builder;
import lombok.Data;
import lombok.experimental.FieldDefaults;

@Data
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class ResAdminDeviceConfigDTO {

    Long id;
    String deviceId;
    String osVersion;
    String appVersion;
    Integer ramMB;
    Integer storageFreeMB;
    NetworkType networkType;
    Boolean offlineModeEnabled;
    Long totalDownloadedMB;
    Double lastLat;
    Double lastLng;
    Instant lastSeenAt;
    RunningMode runningMode;
    Instant createdAt;
    Instant updatedAt;
    Boolean isActive;
}
