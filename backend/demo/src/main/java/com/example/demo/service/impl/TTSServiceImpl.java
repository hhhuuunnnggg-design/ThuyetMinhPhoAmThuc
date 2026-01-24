package com.example.demo.service.impl;

import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.io.InputStream;
import java.util.HashMap;
import java.util.Map;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.InputStreamResource;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.http.client.HttpComponentsClientHttpRequestFactory;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import com.example.demo.domain.request.tts.ReqTTSDTO;
import com.example.demo.domain.response.tts.ResVoiceDTO;
import com.example.demo.service.TTSService;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;

import lombok.AccessLevel;
import lombok.experimental.FieldDefaults;

@Service
@FieldDefaults(level = AccessLevel.PRIVATE)
public class TTSServiceImpl implements TTSService {

    @Value("${viettelai.tts.api.url:https://viettelai.vn/tts/speech_synthesis}")
    private String ttsApiUrl;

    @Value("${viettelai.tts.voices.url:https://viettelai.vn/tts/voices}")
    private String voicesApiUrl;

    @Value("${viettelai.tts.token:b9ae3920ebb5451dcab13f534f47de0a}")
    private String ttsToken;

    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper;

    public TTSServiceImpl() {
        this.restTemplate = new RestTemplate();
        this.restTemplate.setRequestFactory(new HttpComponentsClientHttpRequestFactory());
        this.objectMapper = new ObjectMapper();
    }

    @Override
    public ResponseEntity<Resource> synthesizeSpeech(ReqTTSDTO request) throws IOException {
        // Tạo request body
        Map<String, Object> requestBody = new HashMap<>();
        requestBody.put("text", request.getText());
        requestBody.put("voice", request.getVoice());
        requestBody.put("speed", request.getSpeed());
        requestBody.put("tts_return_option", request.getTtsReturnOption());
        requestBody.put("token", ttsToken);
        requestBody.put("without_filter", request.getWithoutFilter());

        // Tạo headers
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);

        HttpEntity<Map<String, Object>> entity = new HttpEntity<>(requestBody, headers);

        try {
            // Gọi API ViettelAI
            ResponseEntity<byte[]> response = restTemplate.exchange(
                    ttsApiUrl,
                    HttpMethod.POST,
                    entity,
                    byte[].class);

            // Kiểm tra response
            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                // Tạo InputStreamResource từ byte array
                InputStream inputStream = new ByteArrayInputStream(response.getBody());
                InputStreamResource resource = new InputStreamResource(inputStream);

                // Xác định content type dựa trên tts_return_option
                String contentType = request.getTtsReturnOption() == 2
                        ? "audio/wav"
                        : "audio/mpeg";

                // Lấy request_id từ header nếu có
                String requestId = response.getHeaders().getFirst("request_id");

                HttpHeaders responseHeaders = new HttpHeaders();
                responseHeaders.setContentType(MediaType.parseMediaType(contentType));
                responseHeaders.setContentLength(response.getBody().length);
                if (requestId != null) {
                    responseHeaders.set("request_id", requestId);
                }

                return ResponseEntity.ok()
                        .headers(responseHeaders)
                        .body(resource);
            } else {
                throw new IOException("Không thể tạo audio từ API ViettelAI");
            }
        } catch (Exception e) {
            throw new IOException("Lỗi khi gọi API ViettelAI: " + e.getMessage(), e);
        }
    }

    @Override
    public ResVoiceDTO[] getAvailableVoices() throws IOException {
        try {
            ResponseEntity<String> response = restTemplate.getForEntity(voicesApiUrl, String.class);

            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                return objectMapper.readValue(
                        response.getBody(),
                        new TypeReference<ResVoiceDTO[]>() {
                        });
            } else {
                throw new IOException("Không thể lấy danh sách giọng đọc từ API");
            }
        } catch (Exception e) {
            throw new IOException("Lỗi khi gọi API lấy danh sách giọng đọc: " + e.getMessage(), e);
        }
    }
}
