package com.vintage337.dto;

import jakarta.validation.constraints.NotNull;

public record PatchUserBlockedRequest(@NotNull Boolean blocked) {}
