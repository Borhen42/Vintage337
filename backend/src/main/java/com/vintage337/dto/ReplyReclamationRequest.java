package com.vintage337.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record ReplyReclamationRequest(@NotBlank @Size(max = 8000) String message) {}
