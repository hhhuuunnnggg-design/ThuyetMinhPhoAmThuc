package com.example.demo.domain.response;

import java.time.LocalDateTime;

import lombok.Data;

@Data
public class PostResponseDTO {
    private Long id;
    private String content;
    private String imageUrl;
    private String videoUrl;
    private Boolean visible;
    private LocalDateTime deletedAt;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private Long shareId;
    private LocalDateTime sharedAt;
    private UserSummaryDTO user;

    @Data
    public static class UserSummaryDTO {
        private Long id;
        private String email;
        private String fullname;
        private String avatar;
        private String coverPhoto;
        private String gender;
    }
}
