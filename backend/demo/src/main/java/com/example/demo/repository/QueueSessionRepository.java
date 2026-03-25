package com.example.demo.repository;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.example.demo.domain.QueueSession;

@Repository
public interface QueueSessionRepository extends JpaRepository<QueueSession, Long> {

    List<QueueSession> findByDeviceIdAndExitedAtIsNull(String deviceId);

    Optional<QueueSession> findByDeviceIdAndPoiIdAndExitedAtIsNull(String deviceId, Long poiId);

    @Query("SELECT qs FROM QueueSession qs WHERE qs.exitedAt IS NULL")
    List<QueueSession> findAllActiveSessions();

    @Query("SELECT qs.poi.id, COUNT(qs) FROM QueueSession qs WHERE qs.exitedAt IS NULL GROUP BY qs.poi.id")
    List<Object[]> countActiveByPoi();

    @Query("SELECT COUNT(qs) FROM QueueSession qs WHERE qs.poi.id = :poiId AND qs.exitedAt IS NULL")
    long countActiveByPoiId(@Param("poiId") Long poiId);

    @Query("SELECT COUNT(qs) FROM QueueSession qs WHERE qs.poi.id = :poiId AND qs.createdAt >= :since")
    long countTodayByPoiId(@Param("poiId") Long poiId, @Param("since") Instant since);

    @Query("SELECT COUNT(qs) FROM QueueSession qs WHERE qs.createdAt >= :since")
    long countTodayTotal(@Param("since") Instant since);

    @Query("SELECT SUM(qs.totalListeningTime) FROM QueueSession qs WHERE qs.poi.id = :poiId AND qs.createdAt >= :since")
    Long sumListeningTimeToday(@Param("poiId") Long poiId, @Param("since") Instant since);

    List<QueueSession> findByPoiIdOrderByEnteredAtDesc(Long poiId);
}
