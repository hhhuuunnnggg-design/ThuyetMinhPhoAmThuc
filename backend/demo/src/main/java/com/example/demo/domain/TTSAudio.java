package com.example.demo.domain;

import java.time.Instant;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
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
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
@Table(name = "tts_audios")
public class TTSAudio {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    Long id;

    @Column(nullable = false, length = 10)
    String languageCode; // Mã ngôn ngữ: vi, en, zh, ja, ko, fr

    @Column(columnDefinition = "TEXT", nullable = false)
    String text; // Nội dung text đã chuyển đổi (đã dịch)

    @Column(columnDefinition = "TEXT")
    String translatedText; // Text đã dịch (null cho tiếng Việt)

    @Column(nullable = false)
    String voice; // Mã giọng đọc

    @Column(nullable = false)
    Float speed; // Tốc độ giọng nói

    @Column(nullable = false)
    Integer format; // 2: wav, 3: mp3

    @Column(nullable = false)
    Boolean withoutFilter; // Có sử dụng filter hay không

    @Column
    String fileName; // Tên file trên storage

    @Column
    String s3Url; // URL file (local path)

    @Column
    Long fileSize; // Kích thước file (bytes)

    @Column
    String mimeType; // audio/mpeg hoặc audio/wav

    @Column
    Instant createdAt;

    @Column
    Instant updatedAt;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "group_id")
    TTSAudioGroup group;
}
