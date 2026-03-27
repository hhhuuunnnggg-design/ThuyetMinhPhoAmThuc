package com.example.demo.repository;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.example.demo.domain.NarrationLog;

@Repository
public interface NarrationLogRepository extends JpaRepository<NarrationLog, Long> {

    Optional<NarrationLog> findFirstByDeviceIdAndTtsAudio_IdAndPlayedAtBeforeOrderByPlayedAtDesc(
            String deviceId,
            Long ttsAudioId,
            Instant before);

    @Query("SELECT COUNT(n) FROM NarrationLog n WHERE n.playedAt >= :since")
    long countByPlayedAtAfter(@Param("since") Instant since);

    /**
     * Đếm narration logs theo POI (kể cả SKIPPED — client web gửi khi dừng sớm).
     */
    @Query("SELECT COUNT(n) FROM NarrationLog n " +
           "JOIN n.ttsAudio a " +
           "JOIN a.group g " +
           "JOIN g.poi p " +
           "WHERE p.id = :poiId " +
           "AND (:since IS NULL OR n.playedAt >= :since) " +
           "AND (n.status IS NULL OR n.status IN ('COMPLETED','SKIPPED'))")
    long countByPoiIdSince(@Param("poiId") Long poiId, @Param("since") Instant since);

    /**
     * Top POIs — chỉ {@code COMPLETED}/{@code SKIPPED} để không nhân đôi với dòng {@code PLAYING} (web gửi cả hai).
     * {@code toExclusive}: bắt đầu ngày sau ngày kết thúc (để bao trọn cả ngày {@code to} theo calendar).
     */
    @Query("SELECT p.id, COUNT(n) as cnt FROM NarrationLog n " +
           "JOIN n.ttsAudio a " +
           "JOIN a.group g " +
           "JOIN g.poi p " +
           "WHERE n.playedAt >= :from " +
           "AND n.playedAt < :toExclusive " +
           "AND (n.status IS NULL OR n.status IN ('COMPLETED','SKIPPED')) " +
           "GROUP BY p.id " +
           "ORDER BY cnt DESC")
    List<Object[]> findTopPOIsByNarrationCount(
            @Param("from") Instant from,
            @Param("toExclusive") Instant toExclusive,
            org.springframework.data.domain.Pageable pageable);
}

