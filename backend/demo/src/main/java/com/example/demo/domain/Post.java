package com.example.demo.domain;

import java.time.LocalDateTime;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import jakarta.persistence.Transient;
import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.experimental.FieldDefaults;

@Entity
@Data
@Table(name = "posts")
@FieldDefaults(level = AccessLevel.PRIVATE)
@NoArgsConstructor
@AllArgsConstructor
public class Post {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    Long id;

    @Column(columnDefinition = "TEXT")
    String content;

    String imageUrl;
    String videoUrl;
    Boolean visible = true; // Mặc định là hiển thị
    LocalDateTime deletedAt; // Null nếu chưa bị xóa

    @Column(name = "created_at", updatable = false)
    LocalDateTime createdAt = LocalDateTime.now();

    LocalDateTime updatedAt = LocalDateTime.now();

    @Transient // Không lưu vào database
    Long shareId;

    @Transient // Không lưu vào database
    LocalDateTime sharedAt;

    // Phương thức tiện ích để kiểm tra xem bài viết đã bị xóa chưa
    @jakarta.persistence.Transient
    public boolean isDeleted() {
        return deletedAt != null;
    }

    @ManyToOne
    @JoinColumn(name = "user_id", nullable = false)
    User user;
}
