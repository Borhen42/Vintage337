package com.vintage337.dto;

import java.math.BigDecimal;

public record AdminOrderItemResponse(
    long productId,
    String productName,
    int quantity,
    BigDecimal unitPrice,
    String variantSize,
    String variantColor) {}
