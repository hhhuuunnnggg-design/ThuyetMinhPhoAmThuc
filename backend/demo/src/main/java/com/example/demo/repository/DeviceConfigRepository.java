package com.example.demo.repository;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.example.demo.domain.DeviceConfig;

@Repository
public interface DeviceConfigRepository extends JpaRepository<DeviceConfig, Long> {

    Optional<DeviceConfig> findByDeviceId(String deviceId);

    @Query("SELECT d FROM DeviceConfig d WHERE d.lastSeenAt >= :since")
    List<DeviceConfig> findActiveDevices(@Param("since") Instant since);

    @Query("SELECT COUNT(d) FROM DeviceConfig d WHERE d.runningMode = 'OFFLINE'")
    long countOfflineModeDevices();

    @Query("SELECT COUNT(d) FROM DeviceConfig d WHERE d.lastSeenAt >= :since")
    long countActiveDevices(@Param("since") Instant since);
}
