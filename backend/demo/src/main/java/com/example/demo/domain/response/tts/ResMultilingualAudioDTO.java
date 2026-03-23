package com.example.demo.domain.response.tts;

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
public class ResMultilingualAudioDTO {
    String groupId;
    List<AudioEntry> audios;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    @FieldDefaults(level = AccessLevel.PRIVATE)
    public static class AudioEntry {
        Long id;
        String languageCode;
        String languageName;
        String s3Url;
        Long fileSize;
    }
}
