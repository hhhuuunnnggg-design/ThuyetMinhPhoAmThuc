package com.example.demo.domain.response.app;

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
public class ResNarrationCheckDTO {

    boolean shouldPlay;

    String reason; // OPTIONAL: lý do không phát (ví dụ: "RECENTLY_PLAYED")
}

