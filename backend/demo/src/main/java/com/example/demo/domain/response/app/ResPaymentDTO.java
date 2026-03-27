package com.example.demo.domain.response.app;

import java.time.Instant;

import lombok.AccessLevel;
import lombok.Builder;
import lombok.Data;
import lombok.experimental.FieldDefaults;

@Data
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class ResPaymentDTO {

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
    String payosPaymentLink;
    String payosQrCode;
    Instant paidAt;
    Instant createdAt;
    String description;
}
