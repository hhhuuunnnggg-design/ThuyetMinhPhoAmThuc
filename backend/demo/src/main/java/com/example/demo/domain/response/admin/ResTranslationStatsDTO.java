package com.example.demo.domain.response.admin;

import java.util.List;

import lombok.AccessLevel;
import lombok.Builder;
import lombok.Data;
import lombok.experimental.FieldDefaults;

@Data
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class ResTranslationStatsDTO {

    long totalCorpus;
    long validatedCount;
    long pendingCount;
    Float overallAccuracy;

    List<LanguagePairStats> languagePairs;

    @Data
    @Builder
    @FieldDefaults(level = AccessLevel.PRIVATE)
    public static class LanguagePairStats {
        String sourceLang;
        String targetLang;
        long totalSentences;
        Float avgConfidence;
        long validatedCount;
        long pendingCount;
    }
}
