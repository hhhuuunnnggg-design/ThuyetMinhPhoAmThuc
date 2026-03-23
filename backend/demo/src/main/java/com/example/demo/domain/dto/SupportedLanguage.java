package com.example.demo.domain.dto;

import java.util.Map;

import lombok.AccessLevel;
import lombok.experimental.FieldDefaults;

@FieldDefaults(level = AccessLevel.PRIVATE)
public final class SupportedLanguage {
    public static final String VI = "vi";
    public static final String EN = "en";
    public static final String ZH = "zh";
    public static final String JA = "ja";
    public static final String KO = "ko";
    public static final String FR = "fr";

    public static final Map<String, String> NAMES = Map.of(
            VI, "Tiếng Việt",
            EN, "English",
            ZH, "中文",
            JA, "日本語",
            KO, "한국어",
            FR, "Français");

    public static final Map<String, String> GCP_TTS_VOICES = Map.of(
            EN, "en-US-Neural2-F",
            ZH, "cmn-CN-Standard-A",
            JA, "ja-JP-Standard-A",
            KO, "ko-KR-Standard-A",
            FR, "fr-FR-Standard-A");

    public static final Map<String, String> GCP_LANGUAGE_CODES = Map.of(
            EN, "en-us",
            ZH, "cmn-cn",
            JA, "ja-jp",
            KO, "ko-kr",
            FR, "fr-fr");

    public static String getName(String code) {
        return NAMES.getOrDefault(code, code);
    }

    public static String getVoice(String code) {
        return GCP_TTS_VOICES.get(code);
    }

    public static String getGcpLanguageCode(String code) {
        return GCP_LANGUAGE_CODES.get(code);
    }
}
