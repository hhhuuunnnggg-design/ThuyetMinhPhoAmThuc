package com.example.demo.domain;

import java.time.Instant;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.experimental.FieldDefaults;

@Entity
@Table(name = "device_configs")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class DeviceConfig {

    public enum RunningMode {
        OFFLINE,    // Thiết bị đủ mạnh, đã sync → phát local
        STREAMING   // Thiết bị yếu hoặc chưa sync → stream từ server
    }

    public enum NetworkType {
        WIFI, CELLULAR_4G, CELLULAR_5G, OFFLINE
    }

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    Long id;

    /**
     * Device identifier duy nhất (UUID được sinh ở app).
     */
    @Column(unique = true, nullable = false, length = 100)
    String deviceId;

    @Column(length = 100)
    String osVersion;

    @Column(length = 20)
    String appVersion;

    /**
     * RAM thiết bị (MB). Ví dụ: 4096 = 4GB.
     */
    Integer ramMB;

    /**
     * Storage trống (MB).
     */
    Integer storageFreeMB;

    @Enumerated(EnumType.STRING)
    @Column(length = 20)
    NetworkType networkType;

    /**
     * Lần sync offline bundle cuối.
     */
    Instant lastSyncAt;

    /**
     * Thiết bị có đang chạy offline mode không.
     */
    @Column
    @Builder.Default
    Boolean offlineModeEnabled = false;

    /**
     * Tổng dung lượng đã download offline (MB).
     */
    @Builder.Default
    Long totalDownloadedMB = 0L;

    /**
     * Vị trí cuối cùng của thiết bị.
     */
    Double lastLat;
    Double lastLng;

    /**
     * Lần cuối thiết bị gửi heartbeat.
     */
    Instant lastSeenAt;

    /**
     * Chế độ chạy hiện tại.
     */
    @Enumerated(EnumType.STRING)
    @Column(length = 20)
    @Builder.Default
    RunningMode runningMode = RunningMode.STREAMING;

    /**
     * Version offline bundle mà thiết bị đang có (POI ID → version).
     * Lưu dạng JSON string: {"1": 3, "2": 1, ...}
     */
    @Column(columnDefinition = "TEXT")
    String downloadedVersions;

    @Column(nullable = false)
    @Builder.Default
    Instant createdAt = Instant.now();

    @Column
    Instant updatedAt;

    @Column
    @Builder.Default
    Boolean isActive = true;

    /**
     * Xác định chế độ chạy dựa trên cấu hình thiết bị.
     * OFFLINE: RAM ≥ 4096 MB, Storage ≥ 500 MB, đã sync trong vòng 24h
     * STREAMING: còn lại
     */
    public RunningMode computeRunningMode() {
        if (ramMB != null && ramMB >= 4096
                && storageFreeMB != null && storageFreeMB >= 500) {
            return RunningMode.OFFLINE;
        }
        return RunningMode.STREAMING;
    }

    public void updateHeartbeat(double lat, double lng) {
        this.lastLat = lat;
        this.lastLng = lng;
        this.lastSeenAt = Instant.now();
        this.updatedAt = Instant.now();
    }
}
