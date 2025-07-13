package com.example.demo.service;

import java.util.Collections;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.example.demo.domain.ChatbotMessage;
import com.example.demo.domain.User;
import com.example.demo.repository.ChatbotMessageRepository;
import com.example.demo.repository.UserServiceRepository;

@Service
public class ChatbotService {

    @Autowired
    private ChatbotMessageRepository chatbotMessageRepository;

    @Autowired
    private UserServiceRepository userRepository;

    @Autowired
    private AIService aiService;

    /**
     * Lưu tin nhắn chatbot
     * 
     * @param userId  ID của người dùng
     * @param content Nội dung tin nhắn
     * @param isBot   Có phải tin nhắn từ bot không
     * @return Tin nhắn đã lưu
     */
    public ChatbotMessage saveMessage(Long userId, String content, Boolean isBot) {
        Optional<User> userOpt = userRepository.findById(userId);
        if (userOpt.isEmpty()) {
            throw new RuntimeException("User not found with id: " + userId);
        }

        ChatbotMessage message = new ChatbotMessage(userOpt.get(), content, isBot);
        return chatbotMessageRepository.save(message);
    }

    /**
     * Xử lý tin nhắn từ người dùng và trả về phản hồi từ AI
     * 
     * @param userId      ID của người dùng
     * @param userMessage Tin nhắn từ người dùng
     * @return Phản hồi từ AI
     */
    @Transactional
    public ChatbotMessage processUserMessage(Long userId, String userMessage) {
        // Lưu tin nhắn của người dùng
        ChatbotMessage userMsg = saveMessage(userId, userMessage, false);

        // Lấy lịch sử chat gần đây (10 tin nhắn cuối)
        List<ChatbotMessage> recentMessages = getRecentMessages(userId, 10);
        List<String> chatHistory = recentMessages.stream()
                .map(ChatbotMessage::getContent)
                .collect(Collectors.toList());

        // Lấy phản hồi từ AI
        String aiResponse = aiService.getAIResponse(userMessage, chatHistory);

        // Lưu phản hồi của AI
        ChatbotMessage botMsg = saveMessage(userId, aiResponse, true);

        return botMsg;
    }

    /**
     * Lấy lịch sử tin nhắn của một người dùng
     * 
     * @param userId ID của người dùng
     * @return Danh sách tin nhắn
     */
    public List<ChatbotMessage> getChatHistory(Long userId) {
        Optional<User> userOpt = userRepository.findById(userId);
        if (userOpt.isEmpty()) {
            return Collections.emptyList();
        }

        return chatbotMessageRepository.findByUserOrderByTimestampAsc(userOpt.get());
    }

    /**
     * Lấy n tin nhắn gần nhất của một người dùng
     * 
     * @param userId ID của người dùng
     * @param limit  Số lượng tin nhắn tối đa
     * @return Danh sách tin nhắn
     */
    public List<ChatbotMessage> getRecentMessages(Long userId, int limit) {
        return chatbotMessageRepository.findRecentMessagesByUserId(userId, limit);
    }

    /**
     * Xóa tất cả tin nhắn của một người dùng
     * 
     * @param userId ID của người dùng
     */
    @Transactional
    public void clearChatHistory(Long userId) {
        Optional<User> userOpt = userRepository.findById(userId);
        if (userOpt.isPresent()) {
            chatbotMessageRepository.deleteByUser(userOpt.get());
        }
    }

    /**
     * Kiểm tra xem người dùng có tồn tại không
     * 
     * @param userId ID của người dùng
     * @return true nếu tồn tại, false nếu không
     */
    public boolean userExists(Long userId) {
        return userRepository.findById(userId).isPresent();
    }
}
