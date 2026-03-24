package com.example.demo.domain;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;

import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToMany;
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

    // ===== THÔNG TIN ẨM THỰC (DUY NHẤT trong group) =====
    @Column
    String foodName; // Tên món ăn

    @Column(precision = 12, scale = 2)
    BigDecimal price; // Giá món ăn

    @Column(columnDefinition = "TEXT")
    String description; // Mô tả chi tiết món ăn

    @Column
    String imageUrl; // Link ảnh món ăn

    // ===== VỊ TRÍ GPS (DUY NHẤT trong group) =====
    @Column
    Double latitude; // Vĩ độ

    @Column
    Double longitude; // Kinh độ

    @Column
    Float accuracy; // Độ chính xác của vị trí (mét)

    // ===== CẤU HÌNH GEOFENCE (DUY NHẤT trong group) =====
    @Column
    Float triggerRadiusMeters; // Bán kính kích hoạt POI (mét)

    @Column
    Integer priority; // Mức ưu tiên khi có nhiều POI gần nhau

    // ===== TEXT & VOICE GỐC (DUY NHẤT trong group) =====
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

    // ===== USER INFO (DUY NHẤT trong group) =====
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id")
    User user; // User sở hữu audio này

    @Column
    String createdBy; // Email của user (backup)

    @Column(nullable = false)
    Instant createdAt;

    @Column
    Instant updatedAt;

    // ===== DANH SÁCH AUDIO (1 audio mỗi ngôn ngữ) =====
    @OneToMany(mappedBy = "group", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    List<TTSAudio> audios;
}
