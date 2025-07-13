package com.example.demo.service;

import java.util.HashMap;
import java.util.Map;

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

import jakarta.annotation.PostConstruct;

@Service
public class WebSearchService {

    @Value("${serpapi.key:}")
    private String serpApiKey;

    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper;

    public WebSearchService() {
        this.restTemplate = new RestTemplate();
        this.objectMapper = new ObjectMapper();
    }

    @PostConstruct
    public void init() {
        System.out.println("=== WebSearchService Initialized ===");
        System.out.println(
                "SerpAPI Key: " + (serpApiKey != null && !serpApiKey.isEmpty() ? "configured" : "not configured"));
    }

    /**
     * Tìm kiếm thông tin từ web
     */
    public String searchWeb(String query) {
        try {
            System.out.println("=== WebSearchService.searchWeb ===");
            System.out.println("Query: " + query);
            System.out.println("SerpAPI Key: " + serpApiKey);

            // Sử dụng SerpAPI để tìm kiếm (cần đăng ký API key)
            if (serpApiKey == null || serpApiKey.isEmpty()) {
                System.out.println("SerpAPI key not configured");
                return "Không thể tìm kiếm thông tin mới nhất. Vui lòng kiểm tra cấu hình API.";
            }

            String url = "https://serpapi.com/search.json?q=" + query + "&api_key=" + serpApiKey
                    + "&engine=google&num=3";

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);

            System.out.println("Sending request to SerpAPI...");
            System.out.println("URL: " + url);

            HttpEntity<String> request = new HttpEntity<>(headers);

            ResponseEntity<String> response = restTemplate.exchange(url, HttpMethod.GET, request, String.class);

            System.out.println("SerpAPI Response: " + response.getBody());

            // Parse response
            JsonNode responseJson = objectMapper.readTree(response.getBody());

            StringBuilder result = new StringBuilder();
            JsonNode organicResults = responseJson.get("organic_results");

            if (organicResults != null && organicResults.isArray()) {
                for (JsonNode result_item : organicResults) {
                    String title = result_item.get("title").asText();
                    String snippet = result_item.get("snippet").asText();
                    result.append("• ").append(title).append("\n").append(snippet).append("\n\n");
                }
            }

            System.out.println("Final result: " + result.toString());
            return result.toString();

        } catch (Exception e) {
            e.printStackTrace();
            System.err.println("WebSearchService error: " + e.getMessage());
            return "Không thể tìm kiếm thông tin mới nhất.";
        }
    }

    /**
     * Tìm kiếm tin tức mới nhất
     */
    public String searchNews(String query) {
        try {
            if (serpApiKey == null || serpApiKey.isEmpty()) {
                return "Không thể tìm kiếm tin tức mới nhất.";
            }

            String url = "https://serpapi.com/search.json";

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);

            Map<String, Object> requestBody = new HashMap<>();
            requestBody.put("q", query);
            requestBody.put("api_key", serpApiKey);
            requestBody.put("engine", "google_news");
            requestBody.put("num", 3);

            HttpEntity<Map<String, Object>> request = new HttpEntity<>(requestBody, headers);

            ResponseEntity<String> response = restTemplate.exchange(url, HttpMethod.GET, request, String.class);

            JsonNode responseJson = objectMapper.readTree(response.getBody());

            StringBuilder result = new StringBuilder();
            JsonNode newsResults = responseJson.get("news_results");

            if (newsResults != null && newsResults.isArray()) {
                for (JsonNode news_item : newsResults) {
                    String title = news_item.get("title").asText();
                    String snippet = news_item.get("snippet").asText();
                    result.append("📰 ").append(title).append("\n").append(snippet).append("\n\n");
                }
            }

            return result.toString();

        } catch (Exception e) {
            e.printStackTrace();
            return "Không thể tìm kiếm tin tức mới nhất.";
        }
    }
}