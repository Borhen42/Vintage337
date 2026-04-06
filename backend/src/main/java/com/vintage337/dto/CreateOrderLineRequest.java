package com.vintage337.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;

public record CreateOrderLineRequest(
    @NotNull Long productId,
    @NotNull @Min(1) Integer quantity,
    @NotNull BigDecimal unitPrice,
    String variantSize,
    String variantColor) {}
