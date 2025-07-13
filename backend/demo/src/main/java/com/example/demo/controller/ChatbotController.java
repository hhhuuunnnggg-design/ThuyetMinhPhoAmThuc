package com.example.demo.controller;

import java.util.List;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.example.demo.domain.ChatbotMessage;
import com.example.demo.domain.request.ChatbotMessageRequest;
import com.example.demo.domain.response.ChatbotMessageResponse;
import com.example.demo.domain.response.ResponseObject;
import com.example.demo.service.ChatbotService;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/chatbot")
@CrossOrigin(origins = "*")
public class ChatbotController {

    @Autowired
    private ChatbotService chatbotService;

    /**
     * Gửi tin nhắn và nhận phản hồi từ AI tự động
     */
    @PostMapping("/send-message")
    public ResponseEntity<ResponseObject> sendMessage(@Valid @RequestBody ChatbotMessageRequest request) {
        try {
            // Validation
            if (request.getUserId() == null) {
                return ResponseEntity.badRequest()
                        .body(new ResponseObject("error", "User ID is required", null));
            }

            if (request.getMessage() == null || request.getMessage().trim().isEmpty()) {
                return ResponseEntity.badRequest()
                        .body(new ResponseObject("error", "Message cannot be empty", null));
            }

            // Kiểm tra user có tồn tại không
            if (!chatbotService.userExists(request.getUserId())) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(new ResponseObject("error", "User not found", null));
            }

            // Xử lý tin nhắn và lấy phản hồi từ AI
            ChatbotMessage botResponse = chatbotService.processUserMessage(
                    request.getUserId(),
                    request.getMessage().trim());

            return ResponseEntity.ok(new ResponseObject(
                    "success",
                    "Message processed successfully",
                    new ChatbotMessageResponse(botResponse)));

        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new ResponseObject("error", "Internal server error: " + e.getMessage(), null));
        }
    }

    /**
     * Lưu tin nhắn người dùng vào cơ sở dữ liệu
     */
    @PostMapping("/save-user-message")
    public ResponseEntity<ResponseObject> saveUserMessage(@Valid @RequestBody ChatbotMessageRequest request) {
        try {
            // Validation
            if (request.getUserId() == null) {
                return ResponseEntity.badRequest()
                        .body(new ResponseObject("error", "User ID is required", null));
            }

            if (request.getMessage() == null || request.getMessage().trim().isEmpty()) {
                return ResponseEntity.badRequest()
                        .body(new ResponseObject("error", "Message cannot be empty", null));
            }

            // Lưu tin nhắn của người dùng
            ChatbotMessage userMessage = chatbotService.saveMessage(
                    request.getUserId(),
                    request.getMessage().trim(),
                    false);

            return ResponseEntity.ok(new ResponseObject(
                    "success",
                    "User message saved successfully",
                    new ChatbotMessageResponse(userMessage)));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new ResponseObject("error", e.getMessage(), null));
        }
    }

    /**
     * Lưu tin nhắn bot vào cơ sở dữ liệu
     */
    @PostMapping("/save-bot-message")
    public ResponseEntity<ResponseObject> saveBotMessage(@Valid @RequestBody ChatbotMessageRequest request) {
        try {
            // Validation
            if (request.getUserId() == null) {
                return ResponseEntity.badRequest()
                        .body(new ResponseObject("error", "User ID is required", null));
            }

            if (request.getMessage() == null || request.getMessage().trim().isEmpty()) {
                return ResponseEntity.badRequest()
                        .body(new ResponseObject("error", "Message cannot be empty", null));
            }

            // Lưu phản hồi của bot
            ChatbotMessage botMessage = chatbotService.saveMessage(
                    request.getUserId(),
                    request.getMessage().trim(),
                    true);

            return ResponseEntity.ok(new ResponseObject(
                    "success",
                    "Bot message saved successfully",
                    new ChatbotMessageResponse(botMessage)));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new ResponseObject("error", e.getMessage(), null));
        }
    }

    /**
     * Lấy lịch sử trò chuyện của một người dùng
     */
    @GetMapping("/history/{userId}")
    public ResponseEntity<ResponseObject> getChatHistory(@PathVariable Long userId) {
        try {
            // Kiểm tra user có tồn tại không
            if (!chatbotService.userExists(userId)) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(new ResponseObject("error", "User not found", null));
            }

            List<ChatbotMessage> messages = chatbotService.getChatHistory(userId);
            List<ChatbotMessageResponse> responses = messages.stream()
                    .map(ChatbotMessageResponse::new)
                    .collect(Collectors.toList());

            return ResponseEntity.ok(new ResponseObject(
                    "success",
                    "Chat history fetched successfully",
                    responses));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new ResponseObject("error", e.getMessage(), null));
        }
    }

    /**
     * Lấy n tin nhắn gần nhất của một người dùng
     */
    @GetMapping("/recent/{userId}")
    public ResponseEntity<ResponseObject> getRecentMessages(
            @PathVariable Long userId,
            @RequestParam(defaultValue = "10") int limit) {
        try {
            // Kiểm tra user có tồn tại không
            if (!chatbotService.userExists(userId)) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(new ResponseObject("error", "User not found", null));
            }

            List<ChatbotMessage> messages = chatbotService.getRecentMessages(userId, limit);
            List<ChatbotMessageResponse> responses = messages.stream()
                    .map(ChatbotMessageResponse::new)
                    .collect(Collectors.toList());

            return ResponseEntity.ok(new ResponseObject(
                    "success",
                    "Recent messages fetched successfully",
                    responses));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new ResponseObject("error", e.getMessage(), null));
        }
    }

    /**
     * Xóa lịch sử trò chuyện của một người dùng
     */
    @DeleteMapping("/history/{userId}")
    public ResponseEntity<ResponseObject> clearChatHistory(@PathVariable Long userId) {
        try {
            // Kiểm tra user có tồn tại không
            if (!chatbotService.userExists(userId)) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(new ResponseObject("error", "User not found", null));
            }

            chatbotService.clearChatHistory(userId);
            return ResponseEntity.ok(new ResponseObject(
                    "success",
                    "Chat history cleared successfully",
                    null));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new ResponseObject("error", e.getMessage(), null));
        }
    }
}
