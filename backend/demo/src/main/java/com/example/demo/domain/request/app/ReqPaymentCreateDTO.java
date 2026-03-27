package com.example.demo.domain.request.app;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
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

    /**
     * Số suất (mặc định 1). PayOS hiển thị đúng số lượng khi gửi kèm đơn giá = amount/quantity.
     */
    @Min(value = 1, message = "quantity phải >= 1")
    @Max(value = 999, message = "quantity tối đa 999")
    Integer quantity;

    String description;
}
