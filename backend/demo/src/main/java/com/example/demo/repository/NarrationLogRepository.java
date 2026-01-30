package com.example.demo.repository;

import java.time.Instant;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.example.demo.domain.NarrationLog;

@Repository
public interface NarrationLogRepository extends JpaRepository<NarrationLog, Long> {

    Optional<NarrationLog> findFirstByDeviceIdAndTtsAudio_IdAndPlayedAtBeforeOrderByPlayedAtDesc(
            String deviceId,
            Long ttsAudioId,
            Instant before);
}

