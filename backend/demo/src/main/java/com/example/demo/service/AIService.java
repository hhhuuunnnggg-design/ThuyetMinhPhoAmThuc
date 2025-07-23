package com.example.demo.service;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;

@Service
public class AIService {

    @Value("${gemini.api.key}")
    private String geminiApiKey;

    @Value("${gemini.model}")
    private String geminiModel;

    @Autowired
    private WebSearchService webSearchService;

    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper;

    public AIService() {
        this.restTemplate = new RestTemplate();
        this.objectMapper = new ObjectMapper();
    }

    /**
     * Kiểm tra xem câu hỏi có cần thông tin mới nhất không
     */
    private boolean needsCurrentInfo(String message) {
        String lowerMessage = message.toLowerCase();
        return lowerMessage.contains("hiện tại") ||
                lowerMessage.contains("năm 2025") ||
                lowerMessage.contains("mới nhất") ||
                lowerMessage.contains("tổng thống") ||
                lowerMessage.contains("tin tức") ||
                lowerMessage.contains("thời sự") ||
                lowerMessage.contains("hiện giờ") ||
                lowerMessage.contains("bây giờ");
    }

    /**
     * Gửi tin nhắn đến Gemini và nhận phản hồi
     */
    public String getAIResponse(String userMessage, List<String> chatHistory) {
        try {
            System.out.println("=== AI Service Debug ===");
            System.out.println("User message: " + userMessage);
            System.out.println("Needs current info: " + needsCurrentInfo(userMessage));
            System.out.println("WebSearchService: " + (webSearchService != null ? "injected" : "null"));

            String url = "https://generativelanguage.googleapis.com/v1/models/" + geminiModel
                    + ":generateContent?key=" + geminiApiKey;

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);

            // Xây dựng prompt với context
            StringBuilder promptBuilder = new StringBuilder();
            promptBuilder.append(
                    "Bạn là một trợ lý AI thông minh và hữu ích. Hãy trả lời bằng tiếng Việt và cung cấp thông tin chính xác, cập nhật nhất. Nếu bạn không chắc chắn về thông tin, hãy nói rõ rằng bạn không có thông tin mới nhất và khuyến nghị người dùng kiểm tra từ nguồn đáng tin cậy. Luôn giữ câu trả lời ngắn gọn, dễ hiểu và hữu ích.\n\n");

            // Thêm lịch sử chat (nếu có)
            if (chatHistory != null && !chatHistory.isEmpty()) {
                promptBuilder.append("Lịch sử trò chuyện:\n");
                for (String history : chatHistory) {
                    promptBuilder.append("Người dùng: ").append(history).append("\n");
                }
                promptBuilder.append("\n");
            }

            // Nếu câu hỏi cần thông tin mới nhất, thêm thông tin từ web search
            if (needsCurrentInfo(userMessage)) {
                try {
                    System.out.println("Calling web search for: " + userMessage);
                    String webInfo = webSearchService.searchWeb(userMessage);
                    System.out.println("Web search result: " + webInfo);

                    if (webInfo != null && !webInfo.contains("Không thể tìm kiếm")
                            && !webInfo.contains("SerpAPI key not configured")) {
                        promptBuilder.append("Thông tin mới nhất từ web:\n").append(webInfo).append("\n\n");
                        System.out.println("Added web info to prompt");
                    } else {
                        System.out.println("Web search failed, continuing without web info");
                    }
                } catch (Exception e) {
                    System.err.println("Web search error: " + e.getMessage());
                    e.printStackTrace();
                    // Tiếp tục mà không có web search
                }
            }

            // Thêm câu hỏi hiện tại
            promptBuilder.append("Câu hỏi: ").append(userMessage);

            Map<String, Object> requestBody = new HashMap<>();
            Map<String, Object> contents = new HashMap<>();
            Map<String, Object> part = new HashMap<>();
            part.put("text", promptBuilder.toString());

            List<Map<String, Object>> parts = new java.util.ArrayList<>();
            parts.add(part);
            contents.put("parts", parts);

            List<Map<String, Object>> contentsList = new java.util.ArrayList<>();
            contentsList.add(contents);
            requestBody.put("contents", contentsList);

            System.out.println("Sending request to Gemini...");
            System.out.println("URL: " + url);
            System.out.println("Prompt: " + promptBuilder.toString());

            HttpEntity<Map<String, Object>> request = new HttpEntity<>(requestBody, headers);

            ResponseEntity<String> response = restTemplate.exchange(url, HttpMethod.POST, request, String.class);

            // Parse response
            JsonNode responseJson = objectMapper.readTree(response.getBody());
            String aiResponse = responseJson.get("candidates").get(0).get("content").get("parts").get(0).get("text")
                    .asText();

            System.out.println("AI Response: " + aiResponse);
            return aiResponse;

        } catch (Exception e) {
            e.printStackTrace();
            System.err.println("AI Service error: " + e.getMessage());
            return "Xin lỗi, tôi đang gặp sự cố. Vui lòng thử lại sau. Lỗi: " + e.getMessage();
        }
    }

    /**
     * Gửi tin nhắn đến Gemini API (backup method)
     */
    public String getGeminiResponse(String userMessage) {
        try {
            String url = "https://generativelanguage.googleapis.com/v1beta/models/" + geminiModel
                    + ":generateContent?key=" + geminiApiKey;

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);

            Map<String, Object> requestBody = new HashMap<>();
            Map<String, Object> contents = new HashMap<>();
            Map<String, Object> part = new HashMap<>();
            part.put("text", userMessage);

            List<Map<String, Object>> parts = new java.util.ArrayList<>();
            parts.add(part);
            contents.put("parts", parts);

            List<Map<String, Object>> contentsList = new java.util.ArrayList<>();
            contentsList.add(contents);
            requestBody.put("contents", contentsList);

            HttpEntity<Map<String, Object>> request = new HttpEntity<>(requestBody, headers);

            ResponseEntity<String> response = restTemplate.exchange(url, HttpMethod.POST, request, String.class);

            // Parse response
            JsonNode responseJson = objectMapper.readTree(response.getBody());
            String aiResponse = responseJson.get("candidates").get(0).get("content").get("parts").get(0).get("text")
                    .asText();

            return aiResponse;

        } catch (Exception e) {
            e.printStackTrace();
            return "Xin lỗi, tôi đang gặp sự cố. Vui lòng thử lại sau.";
        }
    }
}