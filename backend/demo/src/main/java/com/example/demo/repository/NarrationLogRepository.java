package com.example.demo.repository;

import java.time.Instant;
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
}

