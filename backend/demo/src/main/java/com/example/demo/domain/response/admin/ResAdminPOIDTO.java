package com.example.demo.domain.response.admin;

import java.math.BigDecimal;
import java.time.Instant;

import com.example.demo.domain.POI;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * POI cho admin — chứa đầy đủ thông tin POI (foodName, GPS, user, restaurant).
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ResAdminPOIDTO {

    Long id;

    // ===== USER sở hữu =====
    Long userId;
    String userEmail;
    String userFullName;

    // ===== THÔNG TIN ẨM THỰC (từ POI) =====
    String foodName;
    BigDecimal price;
    String description;
    String imageUrl;

    // ===== VỊ TRÍ =====
    String address;
    String category;
    String openHours;
    String phone;

    // ===== GPS =====
    Double latitude;
    Double longitude;
    Float accuracy;
    Float triggerRadiusMeters;
    Integer priority;

    // ===== TRẠNG THÁI =====
    Boolean isActive;
    Long viewCount;
    Long likeCount;
    String qrCode;
    Integer version;

    // ===== NHÀ HÀNG =====
    Long restaurantId;

    // ===== TIMESTAMPS =====
    Instant createdAt;
    Instant updatedAt;

    public static ResAdminPOIDTO from(POI p) {
        if (p == null) {
            return null;
        }
        Long uid = null;
        String uemail = null;
        String ufname = null;
        if (p.getUser() != null) {
            uid = p.getUser().getId();
            uemail = p.getUser().getEmail();
            ufname = (p.getUser().getFirstName() + " " + p.getUser().getLastName()).trim();
        }
        Long rid = null;
        if (p.getRestaurant() != null) {
            rid = p.getRestaurant().getId();
        }
        return ResAdminPOIDTO.builder()
                .id(p.getId())
                .userId(uid)
                .userEmail(uemail)
                .userFullName(ufname)
                .foodName(p.getFoodName())
                .price(p.getPrice())
                .description(p.getDescription())
                .imageUrl(p.getImageUrl())
                .address(p.getAddress())
                .category(p.getCategory())
                .openHours(p.getOpenHours())
                .phone(p.getPhone())
                .latitude(p.getLatitude())
                .longitude(p.getLongitude())
                .accuracy(p.getAccuracy())
                .triggerRadiusMeters(p.getTriggerRadiusMeters())
                .priority(p.getPriority())
                .isActive(p.getIsActive())
                .viewCount(p.getViewCount())
                .likeCount(p.getLikeCount())
                .qrCode(p.getQrCode())
                .version(p.getVersion())
                .restaurantId(rid)
                .createdAt(p.getCreatedAt())
                .updatedAt(p.getUpdatedAt())
                .build();
    }
}
