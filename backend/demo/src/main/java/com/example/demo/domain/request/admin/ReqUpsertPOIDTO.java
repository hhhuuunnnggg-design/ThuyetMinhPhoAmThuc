package com.example.demo.domain.request.admin;

import java.math.BigDecimal;

import jakarta.validation.constraints.NotNull;
import lombok.AccessLevel;
import lombok.Data;
import lombok.experimental.FieldDefaults;

@Data
@FieldDefaults(level = AccessLevel.PRIVATE)
public class ReqUpsertPOIDTO {

    String address;

    String category;

    String openHours;

    String phone;

    // ===== GPS — thuộc về POI =====
    Double latitude;
    Double longitude;
    Float accuracy;
    Float triggerRadiusMeters;
    Integer priority;

    Long restaurantId;

    // ===== THÔNG TIN ẨM THỰC — thuộc về POI =====
    String foodName;
    BigDecimal price;
    String description;
    String imageUrl;
}
