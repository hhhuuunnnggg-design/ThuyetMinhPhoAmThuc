package com.example.demo.domain.response.tts;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.Map;

import com.example.demo.domain.TTSAudioGroup;

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

    // ===== POI liên kết =====
    Long poiId;

    // ===== USER info (từ POI) =====
    Long userId;
    String userEmail;
    String userFullName;

    // ===== TEXT & VOICE GỐC (tiếng Việt) =====
    String originalText;
    String originalVoice;
    Float originalSpeed;
    Integer originalFormat;
    Boolean originalWithoutFilter;

    // ===== AUDIO ĐA NGÔN NGỮ =====
    Map<String, ResAudioDataDTO> audioMap;

    // ===== TIME =====
    String createdBy;
    Instant createdAt;
    Instant updatedAt;

    public static ResTTSAudioGroupDTO fromEntity(TTSAudioGroup g) {
        if (g == null) return null;

        Long uid = null;
        String uemail = null;
        String ufname = null;
        if (g.getPoi() != null && g.getPoi().getUser() != null) {
            var u = g.getPoi().getUser();
            uid = u.getId();
            uemail = u.getEmail();
            ufname = ((u.getFirstName() != null ? u.getFirstName() : "")
                    + " " + (u.getLastName() != null ? u.getLastName() : "")).trim();
        }

        return ResTTSAudioGroupDTO.builder()
                .id(g.getId())
                .groupKey(g.getGroupKey())
                .poiId(g.getPoi() != null ? g.getPoi().getId() : null)
                .userId(uid)
                .userEmail(uemail)
                .userFullName(ufname)
                .originalText(g.getOriginalText())
                .originalVoice(g.getOriginalVoice())
                .originalSpeed(g.getOriginalSpeed())
                .originalFormat(g.getOriginalFormat())
                .originalWithoutFilter(g.getOriginalWithoutFilter())
                .audioMap(g.getAudioMap() != null
                        ? g.getAudioMap().entrySet().stream().collect(java.util.stream.Collectors.toMap(
                                java.util.Map.Entry::getKey,
                                e -> ResAudioDataDTO.builder()
                                        .fileName(e.getValue().getFileName())
                                        .s3Url(e.getValue().getS3Url())
                                        .fileSize(e.getValue().getFileSize())
                                        .mimeType(e.getValue().getMimeType())
                                        .build()))
                        : null)
                .createdBy(g.getCreatedBy())
                .createdAt(g.getCreatedAt())
                .updatedAt(g.getUpdatedAt())
                .build();
    }
}
