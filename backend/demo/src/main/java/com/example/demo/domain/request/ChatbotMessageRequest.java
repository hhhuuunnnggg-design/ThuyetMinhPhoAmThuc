package com.example.demo.domain.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ChatbotMessageRequest {

    @NotNull(message = "user id không được để trống")
    private Long userId;

    @NotBlank(message = "message không được để trống")
    private String message;
}
