package com.example.demo.domain.response.admin;

import java.time.Instant;

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
public class ResAdminPaymentDTO {

    Long id;
    String userId;
    Long poiId;
    String poiName;
    Long restaurantId;
    String restaurantName;
    Long amount;
    Integer quantity;
    String currency;
    String status;
    String payosTransactionId;
    String payosPaymentLinkId;
    String payosPaymentLink;
    Instant paidAt;
    Instant createdAt;
    String description;
}
