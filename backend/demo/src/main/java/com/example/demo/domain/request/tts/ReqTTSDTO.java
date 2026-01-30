package com.example.demo.domain.request.tts;

import java.math.BigDecimal;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AccessLevel;
import lombok.Data;
import lombok.experimental.FieldDefaults;

@Data
@FieldDefaults(level = AccessLevel.PRIVATE)
public class ReqTTSDTO {
    @NotBlank(message = "Text không được để trống")
    String text;

    @NotBlank(message = "Voice không được để trống")
    String voice;

    @NotNull(message = "Speed không được để trống")
    Float speed = 1.0f;

    @NotNull(message = "TTS return option không được để trống")
    Integer ttsReturnOption = 3; // 2: wav, 3: mp3

    Boolean withoutFilter = false;

    // Thông tin thuyết minh ẩm thực
    String foodName;       // Tên món ăn
    BigDecimal price;      // Giá món ăn
    String description;    // Mô tả chi tiết món ăn
    String imageUrl;       // Link ảnh món ăn

    // Thông tin vị trí (GPS)
    Double latitude;       // Vĩ độ
    Double longitude;      // Kinh độ
    Float accuracy;        // Độ chính xác vị trí (mét)

    // Cấu hình geofence cho POI
    Float triggerRadiusMeters; // Bán kính kích hoạt (mét)
    Integer priority;          // Ưu tiên khi có nhiều POI gần nhau
}
