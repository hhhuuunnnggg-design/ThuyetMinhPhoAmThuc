package com.example.demo.service;

public interface GoogleCloudTTSService {
    /**
     * Synthesize speech bằng Google Cloud TTS.
     * @param text Nội dung text cần đọc
     * @param languageCode Mã ngôn ngữ (en, zh, ja, ko, fr)
     * @param speed Tốc độ giọng nói (1.0 = bình thường)
     * @return byte[] audio (MP3 format)
     */
    byte[] synthesize(String text, String languageCode, float speed);
}
