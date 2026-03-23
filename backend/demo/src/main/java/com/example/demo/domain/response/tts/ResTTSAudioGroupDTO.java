package com.example.demo.domain.response.tts;

import java.time.Instant;
import java.util.List;

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
public class ResTTSAudioGroupDTO {
    Long id;
    String groupKey;
    String foodName;
    String originalText;
    String originalVoice;
    Instant createdAt;
    List<ResMultilingualAudioDTO.AudioEntry> audios;
}
