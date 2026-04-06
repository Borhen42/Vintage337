package com.vintage337.dto;

import java.time.LocalDateTime;

public record AdminUserResponse(
    long id,
    String email,
    String fullName,
    String role,
    boolean blocked,
    LocalDateTime createdAt) {}
