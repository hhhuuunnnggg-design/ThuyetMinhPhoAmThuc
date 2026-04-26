package com.example.demo.repository;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.example.demo.domain.ActiveNarration;
import com.example.demo.domain.ActiveNarration.NarrationStatus;

@Repository
public interface ActiveNarrationRepository extends JpaRepository<ActiveNarration, Long> {

    List<ActiveNarration> findByStatus(NarrationStatus status);

    Optional<ActiveNarration> findByDeviceIdAndStatus(String deviceId, NarrationStatus status);

    List<ActiveNarration> findByPoiIdAndStatus(Long poiId, NarrationStatus status);

    @Query("SELECT COUNT(a) FROM ActiveNarration a WHERE a.status = 'PLAYING' AND a.deviceId IN (SELECT d.deviceId FROM DeviceConfig d WHERE d.isActive = true AND d.lastSeenAt >= :since)")
    long countCurrentlyPlayingOnline(@Param("since") Instant since);

    @Query("SELECT COUNT(a) FROM ActiveNarration a WHERE a.poi.id = :poiId AND a.status = 'PLAYING'")
    long countPlayingByPoi(@Param("poiId") Long poiId);

    @Query("SELECT a.poi.id, COUNT(a) FROM ActiveNarration a WHERE a.status = 'PLAYING' GROUP BY a.poi.id")
    List<Object[]> countPlayingByPoi();

    @Query("SELECT a FROM ActiveNarration a WHERE a.status = 'PLAYING' AND a.estimatedEndAt < :now")
    List<ActiveNarration> findExpiredPlaying(@Param("now") Instant now);

    List<ActiveNarration> findByDeviceId(String deviceId);

    @Query("SELECT COUNT(a) FROM ActiveNarration a WHERE a.status = 'PLAYING' AND a.poi.id = :poiId")
    int getActiveCountByPoiId(@Param("poiId") Long poiId);

    /**
     * Đang phát — JOIN FETCH để map DTO. Chỉ lấy những thiết bị đang online (tránh app bị tắt đột ngột/tắt ngầm).
     */
    @Query("SELECT a FROM ActiveNarration a JOIN FETCH a.poi p JOIN FETCH a.audio "
            + "WHERE a.status = 'PLAYING' "
            + "AND (:ownerUserId IS NULL OR p.user.id = :ownerUserId) "
            + "AND a.deviceId IN (SELECT d.deviceId FROM DeviceConfig d WHERE d.isActive = true AND d.lastSeenAt >= :since)")
    List<ActiveNarration> findPlayingWithPoiAndAudioOnline(@Param("ownerUserId") Long ownerUserId, @Param("since") Instant since);

    /** Số lượng device khác nhau đã có narration (bất kỳ trạng thái) từ {@code since} đến nay. */
    @Query("SELECT COUNT(DISTINCT a.deviceId) FROM ActiveNarration a WHERE a.createdAt >= :since")
    long countDistinctDevicesToday(@Param("since") Instant since);
}
