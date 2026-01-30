package com.example.demo.service;

import java.time.Duration;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import com.example.demo.domain.NarrationLog;
import com.example.demo.domain.response.app.ResNarrationLogDTO;

public interface NarrationService {

    /**
     * Kiểm tra thiết bị có được phép phát audio cho POI này hay không,
     * dựa trên log gần nhất và khoảng cooldown.
     */
    boolean canPlay(String deviceId, Long ttsAudioId, Duration cooldown);

    NarrationLog logPlay(NarrationLog log);

    /**
     * Lấy danh sách narration logs với pagination (cho admin)
     */
    Page<ResNarrationLogDTO> getAllLogs(Pageable pageable);
}

