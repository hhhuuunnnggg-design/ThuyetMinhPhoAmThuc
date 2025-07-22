package com.example.demo.domain.response;

import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.experimental.FieldDefaults;

@Data
@AllArgsConstructor
@NoArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)

public class ResComentsByIdDTO {
    Long id;
    String content;
    String createdAt;
    UserGetAccount user;
    Post post;

    @Data
    @FieldDefaults(level = AccessLevel.PRIVATE)
    @AllArgsConstructor
    @NoArgsConstructor
    public static class UserGetAccount {
        long id;
        String email;
        String fullname;
        String avatar;
        Boolean is_blocked;

    }

    @Data
    @FieldDefaults(level = AccessLevel.PRIVATE)
    @AllArgsConstructor
    @NoArgsConstructor
    public static class Post {
        long id;
        String content;
        String imageUrl;
        String videoUrl;
    }
}
