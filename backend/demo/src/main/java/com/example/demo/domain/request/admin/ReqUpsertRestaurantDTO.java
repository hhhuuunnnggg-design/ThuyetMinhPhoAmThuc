package com.example.demo.domain.request.admin;

import jakarta.validation.constraints.NotBlank;
import lombok.AccessLevel;
import lombok.Data;
import lombok.experimental.FieldDefaults;

@Data
@FieldDefaults(level = AccessLevel.PRIVATE)
public class ReqUpsertRestaurantDTO {

    @NotBlank(message = "Tên chủ quán không được để trống")
    String ownerName;

    String ownerEmail;
    String ownerPhone;

    String payosClientId;
    String payosApiKey;
    String payosChecksumKey;
    String bankAccount;
    String bankName;
    Float commissionRate;
}
