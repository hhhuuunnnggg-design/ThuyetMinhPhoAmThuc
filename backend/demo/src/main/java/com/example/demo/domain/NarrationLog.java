package com.example.demo.domain;

import java.time.Instant;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.experimental.FieldDefaults;

@Entity
@Table(name = "narration_logs")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class NarrationLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    Long id;

    /**
     * Định danh thiết bị hoặc user (tùy app client gửi gì).
     */
    @Column(nullable = false, length = 100)
    String deviceId;

    @ManyToOne(optional = false)
    @JoinColumn(name = "tts_audio_id")
    TTSAudio ttsAudio;

    @Column(nullable = false)
    Instant playedAt;

    /**
     * Thời lượng phát (giây) - optional, client có thể không gửi.
     */
    @Column
    Integer durationSeconds;

    /**
     * Trạng thái: STARTED, COMPLETED, SKIPPED...
     */
    @Column(length = 30)
    String status;

    @Column(nullable = false)
    Instant createdAt;
}
