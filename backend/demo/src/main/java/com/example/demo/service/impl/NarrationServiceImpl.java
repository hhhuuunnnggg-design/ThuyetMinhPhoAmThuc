package com.example.demo.service.impl;

import java.time.Duration;
import java.time.Instant;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import com.example.demo.domain.NarrationLog;
import com.example.demo.domain.response.app.ResNarrationLogDTO;
import com.example.demo.repository.NarrationLogRepository;
import com.example.demo.service.NarrationService;

@Service
public class NarrationServiceImpl implements NarrationService {

    private final NarrationLogRepository narrationLogRepository;

    public NarrationServiceImpl(NarrationLogRepository narrationLogRepository) {
        this.narrationLogRepository = narrationLogRepository;
    }

    @Override
    public boolean canPlay(String deviceId, Long ttsAudioId, Duration cooldown) {
        Instant now = Instant.now();
        Instant cutoff = now.minus(cooldown);

        return narrationLogRepository
                .findFirstByDeviceIdAndTtsAudio_IdAndPlayedAtBeforeOrderByPlayedAtDesc(deviceId, ttsAudioId, now)
                .map(lastLog -> lastLog.getPlayedAt().isBefore(cutoff))
                .orElse(true);
    }

    @Override
    public NarrationLog logPlay(NarrationLog log) {
        if (log.getCreatedAt() == null) {
            log.setCreatedAt(Instant.now());
        }
        return narrationLogRepository.save(log);
    }

    @Override
    public Page<ResNarrationLogDTO> getAllLogs(Pageable pageable) {
        return narrationLogRepository.findAll(pageable).map(log -> {
            String audioName = log.getTtsAudio().getFoodName();
            if (audioName == null || audioName.isEmpty()) {
                audioName = log.getTtsAudio().getText();
                if (audioName.length() > 50) {
                    audioName = audioName.substring(0, 50) + "...";
                }
            }
            
            return ResNarrationLogDTO.builder()
                    .id(log.getId())
                    .deviceId(log.getDeviceId())
                    .ttsAudioId(log.getTtsAudio().getId())
                    .ttsAudioName(audioName)
                    .playedAt(log.getPlayedAt())
                    .durationSeconds(log.getDurationSeconds())
                    .status(log.getStatus())
                    .createdAt(log.getCreatedAt())
                    .build();
        });
    }
}

