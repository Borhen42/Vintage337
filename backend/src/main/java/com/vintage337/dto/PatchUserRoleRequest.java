package com.vintage337.dto;

import jakarta.validation.constraints.NotBlank;

public record PatchUserRoleRequest(@NotBlank String role) {}
