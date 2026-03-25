package com.example.demo.domain;

import java.time.Instant;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
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
@Table(name = "active_narrations")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class ActiveNarration {

    public enum NarrationStatus {
        PLAYING, COMPLETED, SKIPPED, EXPIRED
    }

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    Long id;

    @Column(nullable = false, length = 100)
    String deviceId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "poi_id", nullable = false)
    POI poi;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "audio_id", nullable = false)
    TTSAudio audio;

    @Column(length = 10)
    String languageCode;

    @Column(nullable = false)
    Instant startedAt;

    /**
     * Thời điểm ước tính kết thúc (startedAt + audio duration).
     */
    Instant estimatedEndAt;

    @Enumerated(EnumType.STRING)
    @Column(length = 20)
    @Builder.Default
    NarrationStatus status = NarrationStatus.PLAYING;

    Double latitude;
    Double longitude;

    @Column(nullable = false)
    @Builder.Default
    Instant createdAt = Instant.now();

    /**
     * Đánh dấu hoàn thành và cập nhật thời gian kết thúc.
     */
    public void complete() {
        this.status = NarrationStatus.COMPLETED;
        this.estimatedEndAt = Instant.now();
    }

    /**
     * Đánh dấu bị bỏ qua.
     */
    public void skip() {
        this.status = NarrationStatus.SKIPPED;
    }

    /**
     * Đánh dấu hết hạn (người dùng đi ra khỏi bán kính quá lâu).
     */
    public void expire() {
        this.status = NarrationStatus.EXPIRED;
    }
}
