package com.example.demo.domain.response.admin;

import java.time.Instant;

import com.example.demo.domain.Restaurant;

import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.experimental.FieldDefaults;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class ResAdminRestaurantDTO {

    Long id;
    Long poiId;
    String ownerName;
    String ownerEmail;
    String ownerPhone;
    String payosClientId;
    String payosApiKey;
    String payosChecksumKey;
    String bankAccount;
    String bankName;
    Float commissionRate;
    Boolean isVerified;
    Instant createdAt;
    Instant updatedAt;

    public static ResAdminRestaurantDTO from(Restaurant r) {
        if (r == null) return null;
        return ResAdminRestaurantDTO.builder()
                .id(r.getId())
                .poiId(r.getPoi() != null ? r.getPoi().getId() : null)
                .ownerName(r.getOwnerName())
                .ownerEmail(r.getOwnerEmail())
                .ownerPhone(r.getOwnerPhone())
                .payosClientId(r.getPayosClientId())
                .payosApiKey(r.getPayosApiKey())
                .payosChecksumKey(r.getPayosChecksumKey())
                .bankAccount(r.getBankAccount())
                .bankName(r.getBankName())
                .commissionRate(r.getCommissionRate())
                .isVerified(r.getIsVerified())
                .createdAt(r.getCreatedAt())
                .updatedAt(r.getUpdatedAt())
                .build();
    }
}
