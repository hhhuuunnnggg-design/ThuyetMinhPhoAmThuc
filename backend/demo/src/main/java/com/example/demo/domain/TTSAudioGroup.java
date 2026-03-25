package com.example.demo.domain;

import java.time.Instant;
import java.util.Map;

import jakarta.persistence.CollectionTable;
import jakarta.persistence.Column;
import jakarta.persistence.ElementCollection;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.MapKeyColumn;
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
@Table(name = "tts_audio_groups")
public class TTSAudioGroup {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    Long id;

    @Column(nullable = false, unique = true, length = 36)
    String groupKey; // UUID — liên kết các audio cùng món

    // ===== THÔNG TIN ẨM THỰC =====
    @Column
    String foodName; // Tên món ăn

    @Column(precision = 12, scale = 2)
    java.math.BigDecimal price; // Giá món ăn

    @Column(columnDefinition = "TEXT")
    String description; // Mô tả chi tiết món ăn

    @Column
    String imageUrl; // Link ảnh món ăn

    // ===== POI liên kết (1 POI → nhiều TTSAudioGroup, chứa audio đa ngôn ngữ) =====
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "poi_id")
    POI poi;

    // ===== TEXT & VOICE GỐC (tiếng Việt) =====
    @Column(columnDefinition = "TEXT", nullable = false)
    String originalText; // Text gốc tiếng Việt

    @Column
    String originalVoice; // Voice tiếng Việt (ViettelAI)

    @Column
    Float originalSpeed; // Tốc độ gốc

    @Column
    Integer originalFormat; // 2: wav, 3: mp3

    @Column
    Boolean originalWithoutFilter; // Có sử dụng filter hay không

    // ===== AUDIO ĐA NGÔN NGỮ — Map<languageCode, AudioData> =====
    @ElementCollection(fetch = FetchType.LAZY)
    @CollectionTable(name = "tts_audio_group_audios", joinColumns = @JoinColumn(name = "group_id"))
    @MapKeyColumn(name = "language_code")
    Map<String, AudioData> audioMap;

    // ===== USER INFO =====

    @Column
    String createdBy; // Email của user (backup)

    @Column(nullable = false)
    Instant createdAt;

    @Column
    Instant updatedAt;
}
