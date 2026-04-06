package com.vintage337.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record CreateReclamationRequest(
    @NotBlank @Email String email,
    @Size(max = 200) String fullName,
    @NotBlank @Size(max = 255) String subject,
    @NotBlank @Size(max = 8000) String message) {}
