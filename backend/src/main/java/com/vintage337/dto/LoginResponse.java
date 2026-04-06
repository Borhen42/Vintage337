package com.vintage337.dto;

public record LoginResponse(
    String accessToken, String tokenType, String email, String role) {}
