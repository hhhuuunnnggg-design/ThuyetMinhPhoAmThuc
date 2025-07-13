package com.example.demo;

import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

import java.util.Arrays;
import java.util.List;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import com.example.demo.controller.ChatbotController;
import com.example.demo.domain.ChatbotMessage;
import com.example.demo.domain.User;
import com.example.demo.domain.request.ChatbotMessageRequest;
import com.example.demo.service.ChatbotService;
import com.fasterxml.jackson.databind.ObjectMapper;

@WebMvcTest(ChatbotController.class)
public class ChatbotControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private ChatbotService chatbotService;

    @Autowired
    private ObjectMapper objectMapper;

    @Test
    public void testSendMessage_Success() throws Exception {
        // Given
        Long userId = 1L;
        String userMessage = "Hello, how are you?";
        String aiResponse = "Hello! I'm doing well, thank you for asking. How can I help you today?";

        User user = new User();
        user.setId(userId);

        ChatbotMessage botResponse = new ChatbotMessage(user, aiResponse, true);

        when(chatbotService.userExists(userId)).thenReturn(true);
        when(chatbotService.processUserMessage(userId, userMessage)).thenReturn(botResponse);

        // When & Then
        mockMvc.perform(post("/api/chatbot/send-message")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(new ChatbotMessageRequest(userId, userMessage))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("success"))
                .andExpect(jsonPath("$.message").value("Message processed successfully"));
    }

    @Test
    public void testSendMessage_UserNotFound() throws Exception {
        // Given
        Long userId = 999L;
        String userMessage = "Hello";

        when(chatbotService.userExists(userId)).thenReturn(false);

        // When & Then
        mockMvc.perform(post("/api/chatbot/send-message")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(new ChatbotMessageRequest(userId, userMessage))))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.status").value("error"))
                .andExpect(jsonPath("$.message").value("User not found"));
    }

    @Test
    public void testGetChatHistory_Success() throws Exception {
        // Given
        Long userId = 1L;
        User user = new User();
        user.setId(userId);

        List<ChatbotMessage> messages = Arrays.asList(
                new ChatbotMessage(user, "Hello", false),
                new ChatbotMessage(user, "Hi there!", true));

        when(chatbotService.userExists(userId)).thenReturn(true);
        when(chatbotService.getChatHistory(userId)).thenReturn(messages);

        // When & Then
        mockMvc.perform(get("/api/chatbot/history/{userId}", userId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("success"))
                .andExpect(jsonPath("$.message").value("Chat history fetched successfully"));
    }

    @Test
    public void testGetChatHistory_UserNotFound() throws Exception {
        // Given
        Long userId = 999L;

        when(chatbotService.userExists(userId)).thenReturn(false);

        // When & Then
        mockMvc.perform(get("/api/chatbot/history/{userId}", userId))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.status").value("error"))
                .andExpect(jsonPath("$.message").value("User not found"));
    }
}