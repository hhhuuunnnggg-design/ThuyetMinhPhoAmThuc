package com.example.demo.controller;

import java.io.IOException;
import java.util.Arrays;
import java.util.List;

import org.springframework.core.io.Resource;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.example.demo.domain.request.tts.ReqTTSDTO;
import com.example.demo.domain.response.RestResponse;
import com.example.demo.domain.response.tts.ResVoiceDTO;
import com.example.demo.domain.response.tts.ResVoicesDTO;
import com.example.demo.service.TTSService;
import com.example.demo.util.annotation.ApiMessage;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/v1/tts")
public class TTSController {

    private final TTSService ttsService;

    public TTSController(TTSService ttsService) {
        this.ttsService = ttsService;
    }

    @PostMapping("/synthesize")
    @ApiMessage("Chuyển đổi text thành speech")
    public ResponseEntity<Resource> synthesizeSpeech(@Valid @RequestBody ReqTTSDTO request) throws IOException {
        return ttsService.synthesizeSpeech(request);
    }

    @GetMapping("/voices")
    @ApiMessage("Lấy danh sách giọng đọc có sẵn")
    public ResponseEntity<RestResponse<ResVoicesDTO>> getAvailableVoices() throws IOException {
        ResVoiceDTO[] voicesArray = ttsService.getAvailableVoices();
        List<ResVoiceDTO> voicesList = Arrays.asList(voicesArray);

        ResVoicesDTO voicesData = new ResVoicesDTO(voicesList);

        RestResponse<ResVoicesDTO> response = new RestResponse<>();
        response.setStatusCode(200);
        response.setError(null);
        response.setMessage("Lấy danh sách giọng đọc có sẵn");
        response.setData(voicesData);

        return ResponseEntity.ok(response);
    }
}
