package com.example.demo.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.example.demo.domain.ChatbotMessage;
import com.example.demo.domain.User;

import java.util.List;

@Repository
public interface ChatbotMessageRepository extends JpaRepository<ChatbotMessage, Long> {

    // Lấy lịch sử tin nhắn của một người dùng, sắp xếp theo thời gian
    List<ChatbotMessage> findByUserOrderByTimestampAsc(User user);

    // Lấy n tin nhắn gần nhất của một người dùng
    @Query("SELECT cm FROM ChatbotMessage cm WHERE cm.user.id = :userId ORDER BY cm.timestamp DESC LIMIT :limit")
    List<ChatbotMessage> findRecentMessagesByUserId(@Param("userId") Long userId, @Param("limit") int limit);

    // Xóa tất cả tin nhắn của một người dùng
    void deleteByUser(User user);
}
