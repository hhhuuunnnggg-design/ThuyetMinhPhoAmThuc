package com.example.demo.controller;

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

import java.io.ByteArrayInputStream;
import java.time.Instant;
import java.util.HashMap;
import java.util.Map;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.core.io.InputStreamResource;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.web.servlet.MockMvc;

import com.example.demo.domain.request.tts.ReqTTSDTO;
import com.example.demo.domain.response.tts.ResAudioDataDTO;
import com.example.demo.domain.response.tts.ResTTSAudioGroupDTO;
import com.example.demo.service.TTSAudioService;
import com.example.demo.service.TTSService;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@TestPropertySource(locations = "classpath:application-test.properties")
class TTSControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private TTSService ttsService;

    @MockBean
    private TTSAudioService ttsAudioService;

    @BeforeEach
    void setupMocks() throws Exception {
        when(ttsService.synthesizeSpeech(any(ReqTTSDTO.class))).thenAnswer(invocation -> {
            ReqTTSDTO req = invocation.getArgument(0);
            boolean isWav = req.getTtsReturnOption() != null && req.getTtsReturnOption() == 2;
            byte[] fakeAudio = (isWav ? "fake-wav" : "fake-mp3").getBytes();

            Resource resource = new InputStreamResource(new ByteArrayInputStream(fakeAudio));
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.parseMediaType(isWav ? "audio/wav" : "audio/mpeg"));
            return ResponseEntity.ok().headers(headers).body(resource);
        });

        when(ttsAudioService.createGroup(any(ReqTTSDTO.class))).thenAnswer(invocation -> {
            ReqTTSDTO req = invocation.getArgument(0);

            Map<String, ResAudioDataDTO> audioMap = new HashMap<>();
            audioMap.put("vi", ResAudioDataDTO.builder()
                    .fileName("test-file.mp3")
                    .s3Url("http://localhost/test-file.mp3")
                    .fileSize(1024L)
                    .mimeType("audio/mpeg")
                    .build());

            return ResTTSAudioGroupDTO.builder()
                    .id(1L)
                    .groupKey("test-group-key")
                    .originalText(req.getText())
                    .originalVoice(req.getVoice())
                    .originalSpeed(req.getSpeed())
                    .originalFormat(req.getTtsReturnOption())
                    .originalWithoutFilter(req.getWithoutFilter())
                    .poiId(req.getPoiId())
                    .createdBy(req.getCreatedBy())
                    .createdAt(Instant.now())
                    .audioMap(audioMap)
                    .build();
        });
    }

    @Test
    void testCreateGroup_Success() throws Exception {
        String requestBody = """
                {
                    "text": "Xin chào, đây là test text-to-speech",
                    "voice": "hcm-diemmy",
                    "speed": 1.0,
                    "ttsReturnOption": 3,
                    "withoutFilter": false,
                    "poiId": 1
                }
                """;

        mockMvc.perform(post("/api/v1/tts/groups")
                .contentType(MediaType.APPLICATION_JSON)
                .content(requestBody))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.statusCode").value(200))
                .andExpect(jsonPath("$.data.originalText").value("Xin chào, đây là test text-to-speech"))
                .andExpect(jsonPath("$.data.originalVoice").value("hcm-diemmy"))
                .andExpect(jsonPath("$.data.poiId").value(1));
    }

    @Test
    void testCreateGroup_InvalidRequest() throws Exception {
        String requestBody = """
                {
                    "text": "",
                    "voice": "hcm-diemmy",
                    "speed": 1.0,
                    "ttsReturnOption": 3
                }
                """;

        mockMvc.perform(post("/api/v1/tts/groups")
                .contentType(MediaType.APPLICATION_JSON)
                .content(requestBody))
                .andExpect(status().isBadRequest());
    }
}
