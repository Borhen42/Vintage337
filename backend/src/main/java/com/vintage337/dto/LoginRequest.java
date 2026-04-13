package com.vintage337.dto;

import com.vintage337.validation.EmailPattern;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

public record LoginRequest(
    @NotBlank(message = "Enter your email.")
        @Pattern(
            regexp = EmailPattern.REGEX,
            message = "Enter a valid email address (e.g. name@example.com).")
        String email,
    @NotBlank String password) {}
