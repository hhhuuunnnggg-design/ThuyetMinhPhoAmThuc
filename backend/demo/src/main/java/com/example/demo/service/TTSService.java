package com.example.demo.service;

import java.io.IOException;

import org.springframework.core.io.Resource;
import org.springframework.http.ResponseEntity;

import com.example.demo.domain.request.tts.ReqTTSDTO;
import com.example.demo.domain.response.tts.ResVoiceDTO;

public interface TTSService {
    /**
     * Chuyển đổi text thành speech
     * @param request
     * @return
     * @throws IOException
     */
    ResponseEntity<Resource> synthesizeSpeech(ReqTTSDTO request) throws IOException;

    /**
     * Tạo audio tiếng Việt qua ViettelAI (raw bytes, cùng logic với {@link #synthesizeSpeech}).
     */
    byte[] synthesizeViettelSpeechBytes(ReqTTSDTO request) throws IOException;

    /**
     * Lấy danh sách giọng đọc có sẵn
     * @return
     * @throws IOException
     */
    ResVoiceDTO[] getAvailableVoices() throws IOException;
}
