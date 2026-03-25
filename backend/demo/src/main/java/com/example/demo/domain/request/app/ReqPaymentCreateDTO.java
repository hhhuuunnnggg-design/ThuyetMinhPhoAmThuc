package com.example.demo.domain.request.app;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AccessLevel;
import lombok.Data;
import lombok.experimental.FieldDefaults;

@Data
@FieldDefaults(level = AccessLevel.PRIVATE)
public class ReqPaymentCreateDTO {

    @NotNull(message = "poiId không được để trống")
    Long poiId;

    @NotBlank(message = "userId không được để trống")
    String userId;

    @NotNull(message = "amount không được để trống")
    Long amount;

    String description;
}
