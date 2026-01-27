package com.example.demo.controller;

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

import java.io.ByteArrayInputStream;
import java.time.Instant;

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

import com.example.demo.domain.TTSAudio;
import com.example.demo.domain.request.tts.ReqTTSDTO;
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

        when(ttsAudioService.createTTSAudio(any(ReqTTSDTO.class), any(byte[].class), anyString(), anyString()))
                .thenAnswer(invocation -> {
                    ReqTTSDTO req = invocation.getArgument(0);
                    byte[] audio = invocation.getArgument(1);
                    String fileName = invocation.getArgument(2);
                    String createdBy = invocation.getArgument(3);

                    boolean isWav = req.getTtsReturnOption() != null && req.getTtsReturnOption() == 2;
                    return TTSAudio.builder()
                            .id(1L)
                            .text(req.getText())
                            .voice(req.getVoice())
                            .speed(req.getSpeed())
                            .format(req.getTtsReturnOption())
                            .withoutFilter(req.getWithoutFilter())
                            .fileName(fileName)
                            .s3Url(null)
                            .fileSize((long) audio.length)
                            .mimeType(isWav ? "audio/wav" : "audio/mpeg")
                            .createdAt(Instant.now())
                            .createdBy(createdBy)
                            .build();
                });
    }

    @Test
    void testSynthesizeAndSave_Success() throws Exception {
        // Dữ liệu test
        String requestBody = """
                {
                    "text": "Xin chào, đây là test text-to-speech",
                    "voice": "hcm-diemmy",
                    "speed": 1.0,
                    "ttsReturnOption": 3,
                    "withoutFilter": false
                }
                """;

        // Gọi API (cần authentication token)
        mockMvc.perform(post("/api/v1/tts/synthesize-and-save")
                .contentType(MediaType.APPLICATION_JSON)
                .content(requestBody)
        // .header("Authorization", "Bearer YOUR_TOKEN_HERE") // Uncomment và thêm token
        )
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.statusCode").value(200))
                .andExpect(jsonPath("$.message").value("Tạo và lưu audio thành công"))
                .andExpect(jsonPath("$.data").exists())
                .andExpect(jsonPath("$.data.text").value("Xin chào, đây là test text-to-speech"))
                .andExpect(jsonPath("$.data.voice").value("hcm-diemmy"));
    }

    @Test
    void testSynthesizeAndSave_WithWAV() throws Exception {
        String requestBody = """
                {
                    "text": "Test với định dạng WAV",
                    "voice": "hn-quynhanh",
                    "speed": 1.2,
                    "ttsReturnOption": 2,
                    "withoutFilter": true
                }
                """;

        mockMvc.perform(post("/api/v1/tts/synthesize-and-save")
                .contentType(MediaType.APPLICATION_JSON)
                .content(requestBody)
        // .header("Authorization", "Bearer YOUR_TOKEN_HERE")
        )
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.format").value(2));
    }

    @Test
    void testSynthesizeAndSave_InvalidRequest() throws Exception {
        // Test với text rỗng
        String requestBody = """
                {
                    "text": "",
                    "voice": "hcm-diemmy",
                    "speed": 1.0,
                    "ttsReturnOption": 3
                }
                """;

        mockMvc.perform(post("/api/v1/tts/synthesize-and-save")
                .contentType(MediaType.APPLICATION_JSON)
                .content(requestBody)
        // .header("Authorization", "Bearer YOUR_TOKEN_HERE")
        )
                .andExpect(status().isBadRequest());
    }
}
