package com.example.demo.domain;

import java.time.Instant;
import java.util.UUID;

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
@Table(name = "pois")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class POI {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    Long id;

    /**
     * User sở hữu / tạo POI này.
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id")
    User user;

    // ===== THÔNG TIN ẨM THỰC — thuộc về POI, TTSAudioGroup chỉ chứa audio =====
    @Column
    String foodName; // Tên món ăn

    @Column(precision = 12, scale = 2)
    java.math.BigDecimal price; // Giá món ăn

    @Column(columnDefinition = "TEXT")
    String description; // Mô tả chi tiết món ăn

    @Column
    String imageUrl; // Link ảnh món ăn

    // ===== VỊ TRÍ GPS — thuộc về POI =====
    @Column
    Double latitude; // Vĩ độ

    @Column
    Double longitude; // Kinh độ

    @Column
    Float accuracy; // Độ chính xác của vị trí (mét)

    @Column
    Float triggerRadiusMeters; // Bán kính kích hoạt (mét)

    @Column
    Integer priority; // Ưu tiên khi nhiều POI gần nhau

    @Column
    String address;

    /**
     * Loại địa điểm: street_food, restaurant, cafe, market, hotel...
     */
    @Column(length = 50)
    String category;

    @Column
    String openHours;

    @Column(length = 20)
    String phone;

    /**
     * Quán có đang hoạt động không.
     */
    @Column
    @Builder.Default
    Boolean isActive = true;

    @Column
    @Builder.Default
    Long viewCount = 0L;

    @Column
    @Builder.Default
    Long likeCount = 0L;

    /**
     * Mã QR dùng để quét, auto-gen nếu null.
     */
    @Column(unique = true, length = 64)
    String qrCode;

    /**
     * Version để sync offline. Tăng mỗi khi audio/data thay đổi.
     */
    @Column
    @Builder.Default
    Integer version = 1;

    /**
     * Nhà hàng sở hữu POI này.
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "restaurant_id")
    Restaurant restaurant;

    @Column(nullable = false)
    @Builder.Default
    Instant createdAt = Instant.now();

    @Column
    Instant updatedAt;

    /**
     * Sinh QR code ngẫu nhiên nếu chưa có.
     */
    public String resolveQrCode() {
        if (this.qrCode == null || this.qrCode.isBlank()) {
            this.qrCode = UUID.randomUUID().toString();
        }
        return this.qrCode;
    }

    /**
     * Kích hoạt version mới (tăng version khi dữ liệu thay đổi).
     */
    public void bumpVersion() {
        this.version = (this.version == null ? 1 : this.version) + 1;
        this.updatedAt = Instant.now();
    }
}
