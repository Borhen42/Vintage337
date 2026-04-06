package com.vintage337.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record ProductVariantRequest(
    @NotBlank @Size(max = 40) String size,
    @NotBlank @Size(max = 64) String color,
    @NotNull @Min(0) Integer stock) {}
