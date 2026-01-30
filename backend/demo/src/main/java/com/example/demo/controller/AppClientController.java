package com.example.demo.controller;

import java.time.Duration;
import java.time.Instant;
import java.util.List;
import java.util.stream.Collectors;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.example.demo.domain.NarrationLog;
import com.example.demo.domain.TTSAudio;
import com.example.demo.domain.request.app.ReqNarrationCheckDTO;
import com.example.demo.domain.request.app.ReqNarrationLogDTO;
import com.example.demo.domain.response.app.ResNarrationCheckDTO;
import com.example.demo.domain.response.tts.ResTTSAudioDTO;
import com.example.demo.repository.TTSAudioRepository;
import com.example.demo.service.NarrationService;
import com.example.demo.util.annotation.ApiMessage;
import com.example.demo.util.error.IdInvalidException;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/v1/app")
public class AppClientController {

    private final TTSAudioRepository ttsAudioRepository;
    private final NarrationService narrationService;

    // Cooldown mặc định: không phát lại cùng POI trong vòng 5 phút
    private static final Duration DEFAULT_COOLDOWN = Duration.ofMinutes(5);

    public AppClientController(TTSAudioRepository ttsAudioRepository, NarrationService narrationService) {
        this.ttsAudioRepository = ttsAudioRepository;
        this.narrationService = narrationService;
    }

    @GetMapping("/pois")
    @ApiMessage("Danh sách POI (TTSAudio) cho app client")
    public ResponseEntity<List<ResTTSAudioDTO>> getPoisForClient() {
        List<TTSAudio> audios = ttsAudioRepository.findAllByOrderByCreatedAtDesc();

        List<ResTTSAudioDTO> result = audios.stream()
                .map(audio -> ResTTSAudioDTO.builder()
                        .id(audio.getId())
                        .text(audio.getText())
                        .voice(audio.getVoice())
                        .speed(audio.getSpeed())
                        .format(audio.getFormat())
                        .withoutFilter(audio.getWithoutFilter())
                        .fileName(audio.getFileName())
                        .s3Url(audio.getS3Url())
                        .fileSize(audio.getFileSize())
                        .mimeType(audio.getMimeType())
                        .createdAt(audio.getCreatedAt())
                        .updatedAt(audio.getUpdatedAt())
                        .createdBy(audio.getCreatedBy())
                        .foodName(audio.getFoodName())
                        .price(audio.getPrice())
                        .description(audio.getDescription())
                        .imageUrl(audio.getImageUrl())
                        .latitude(audio.getLatitude())
                        .longitude(audio.getLongitude())
                        .accuracy(audio.getAccuracy())
                        .triggerRadiusMeters(audio.getTriggerRadiusMeters())
                        .priority(audio.getPriority())
                        .build())
                .collect(Collectors.toList());

        return ResponseEntity.ok(result);
    }

    @PostMapping("/narration/check")
    @ApiMessage("Kiểm tra có nên phát audio cho POI không")
    public ResponseEntity<ResNarrationCheckDTO> checkNarration(@Valid @RequestBody ReqNarrationCheckDTO request)
            throws IdInvalidException {

        // Đảm bảo POI tồn tại
        ttsAudioRepository.findById(request.getTtsAudioId())
                .orElseThrow(() -> new IdInvalidException("Không tìm thấy TTS audio với id: " + request.getTtsAudioId()));

        boolean canPlay = narrationService.canPlay(request.getDeviceId(), request.getTtsAudioId(), DEFAULT_COOLDOWN);

        ResNarrationCheckDTO res = ResNarrationCheckDTO.builder()
                .shouldPlay(canPlay)
                .reason(canPlay ? null : "RECENTLY_PLAYED")
                .build();

        return ResponseEntity.ok(res);
    }

    @PostMapping("/narration/log")
    @ApiMessage("Ghi log phát thuyết minh")
    public ResponseEntity<Void> logNarration(@Valid @RequestBody ReqNarrationLogDTO request)
            throws IdInvalidException {

        TTSAudio audio = ttsAudioRepository.findById(request.getTtsAudioId())
                .orElseThrow(() -> new IdInvalidException("Không tìm thấy TTS audio với id: " + request.getTtsAudioId()));

        Instant playedAt = Instant.ofEpochMilli(request.getPlayedAt());

        NarrationLog log = NarrationLog.builder()
                .deviceId(request.getDeviceId())
                .ttsAudio(audio)
                .playedAt(playedAt)
                .durationSeconds(request.getDurationSeconds())
                .status(request.getStatus())
                .createdAt(Instant.now())
                .build();

        narrationService.logPlay(log);

        return ResponseEntity.ok().build();
    }
}

