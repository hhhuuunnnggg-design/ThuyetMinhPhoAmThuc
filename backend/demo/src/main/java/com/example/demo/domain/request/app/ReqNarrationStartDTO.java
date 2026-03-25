package com.example.demo.domain.request.app;

import jakarta.validation.constraints.NotNull;
import lombok.AccessLevel;
import lombok.Data;
import lombok.experimental.FieldDefaults;

@Data
@FieldDefaults(level = AccessLevel.PRIVATE)
public class ReqNarrationStartDTO {

    @NotNull(message = "poiId không được để trống")
    Long poiId;

    @NotNull(message = "audioId không được để trống")
    Long audioId;

    String languageCode;
    Double latitude;
    Double longitude;
}
