package com.example.demo.service;

import java.util.Map;

public interface TranslationService {
    /**
     * Dịch một đoạn text từ tiếng Việt sang ngôn ngữ target.
     */
    String translate(String text, String targetLang);

    /**
     * Dịch một đoạn text từ tiếng Việt sang nhiều ngôn ngữ.
     * @return Map&lt;languageCode, translatedText&gt;
     */
    Map<String, String> translateToMultiple(String text);
}
