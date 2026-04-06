package com.vintage337.dto;

import java.time.LocalDateTime;

public record ReclamationResponse(
    long id,
    Long userId,
    String email,
    String fullName,
    String subject,
    String message,
    String status,
    String adminReply,
    LocalDateTime repliedAt,
    LocalDateTime createdAt) {}
