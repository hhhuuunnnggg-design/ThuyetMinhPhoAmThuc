package com.example.demo.controller;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.web.servlet.MockMvc;


@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@TestPropertySource(locations = "classpath:application-test.properties")
class TTSControllerTest {

    @Autowired
    private MockMvc mockMvc;

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
