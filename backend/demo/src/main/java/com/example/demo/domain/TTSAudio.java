package com.example.demo.domain;

import java.math.BigDecimal;
import java.time.Instant;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
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

    @Column(nullable = false, columnDefinition = "TEXT")
    String text; // Nội dung text đã chuyển đổi

    @Column(nullable = false)
    String voice; // Mã giọng đọc (vd: hcm-diemmy)

    @Column(nullable = false)
    Float speed; // Tốc độ giọng nói

    @Column(nullable = false)
    Integer format; // 2: wav, 3: mp3

    @Column(nullable = false)
    Boolean withoutFilter; // Có sử dụng filter hay không

    @Column(nullable = false)
    String fileName; // Tên file trên S3

    @Column(nullable = true) // Cho phép null khi S3 không được cấu hình
    String s3Url; // URL file trên S3 (có thể null nếu S3 không khả dụng)

    @Column(nullable = false)
    Long fileSize; // Kích thước file (bytes)

    @Column(nullable = false)
    String mimeType; // audio/mpeg hoặc audio/wav

    @Column(nullable = false)
    Instant createdAt;

    @Column
    Instant updatedAt;

    // Thông tin user tạo (nếu cần)
    @Column
    String createdBy; // Email của user

    // Thông tin thuyết minh ẩm thực
    @Column
    String foodName; // Tên món ăn

    @Column
    BigDecimal price; // Giá món ăn

    @Column(columnDefinition = "TEXT")
    String description; // Mô tả chi tiết món ăn

    @Column
    String imageUrl; // Link ảnh món ăn

    // Thông tin vị trí (GPS)
    @Column
    Double latitude; // Vĩ độ

    @Column
    Double longitude; // Kinh độ

    @Column
    Float accuracy; // Độ chính xác của vị trí (mét)

    // Cấu hình geofence cho app client
    @Column
    Float triggerRadiusMeters; // Bán kính kích hoạt POI (mét)

    @Column
    Integer priority; // Mức ưu tiên khi có nhiều POI gần nhau (số càng lớn càng ưu tiên)
}
