package com.example.demo.domain.request.app;

import com.example.demo.domain.DeviceConfig.NetworkType;

import jakarta.validation.constraints.NotBlank;
import lombok.AccessLevel;
import lombok.Data;
import lombok.experimental.FieldDefaults;

@Data
@FieldDefaults(level = AccessLevel.PRIVATE)
public class ReqDeviceRegisterDTO {

    @NotBlank(message = "deviceId không được để trống")
    String deviceId;

    String osVersion;
    String appVersion;
    Integer ramMB;
    Integer storageFreeMB;
    NetworkType networkType;
}
