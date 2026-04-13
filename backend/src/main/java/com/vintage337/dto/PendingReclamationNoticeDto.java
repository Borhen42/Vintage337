package com.vintage337.dto;

import java.time.LocalDateTime;

public record PendingReclamationNoticeDto(
    long id, String email, String subject, LocalDateTime createdAt) {}
