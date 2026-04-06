package com.vintage337.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.math.BigDecimal;
import java.util.List;

public record CreateProductRequest(
    @NotBlank @Size(max = 200) String name,
    @NotBlank @Size(max = 120) String category,
    @NotNull @DecimalMin(value = "0.0", inclusive = true) BigDecimal price,
    @NotNull @Size(min = 1, max = 12) List<@NotBlank @Size(max = 2048) String> imageUrls,
    @NotNull @Size(min = 1) @Valid List<ProductVariantRequest> variants,
    @Size(max = 2000) String description) {}
