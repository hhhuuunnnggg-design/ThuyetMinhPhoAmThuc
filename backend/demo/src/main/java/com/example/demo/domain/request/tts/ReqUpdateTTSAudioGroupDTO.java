package com.example.demo.domain.request.tts;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AccessLevel;
import lombok.Data;
import lombok.experimental.FieldDefaults;

@Data
@FieldDefaults(level = AccessLevel.PRIVATE)
public class ReqUpdateTTSAudioGroupDTO {

    // Text & voice gốc
    @NotBlank(message = "Nội dung gốc (tiếng Việt) không được để trống")
    String originalText;

    @NotBlank(message = "Giọng gốc không được để trống")
    String originalVoice;

    @NotNull(message = "Tốc độ gốc không được để trống")
    Float originalSpeed;

    @NotNull(message = "Định dạng gốc không được để trống")
    Integer originalFormat;

    Boolean originalWithoutFilter;
}
