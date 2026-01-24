package com.example.demo.service;

import java.io.IOException;

import org.springframework.core.io.Resource;
import org.springframework.http.ResponseEntity;

import com.example.demo.domain.request.tts.ReqTTSDTO;
import com.example.demo.domain.response.tts.ResVoiceDTO;

public interface TTSService {
    ResponseEntity<Resource> synthesizeSpeech(ReqTTSDTO request) throws IOException;

    ResVoiceDTO[] getAvailableVoices() throws IOException;
}
