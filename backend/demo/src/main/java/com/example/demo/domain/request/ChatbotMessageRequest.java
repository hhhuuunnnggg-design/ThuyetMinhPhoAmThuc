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

    @NotNull(message = "User ID is required")
    private Long userId;

    @NotBlank(message = "Message cannot be empty")
    private String message;
}
