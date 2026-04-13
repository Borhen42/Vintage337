package com.vintage337.dto;

import com.vintage337.validation.EmailPattern;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record RegisterRequest(
    @NotBlank(message = "Enter your name.") @Size(max = 120) String fullName,
    @NotBlank(message = "Enter your email.")
        @Pattern(
            regexp = EmailPattern.REGEX,
            message = "Enter a valid email address (e.g. name@example.com).")
        String email,
    @NotBlank @Size(min = 8, max = 128) String password) {}
