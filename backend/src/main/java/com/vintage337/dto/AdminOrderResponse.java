package com.vintage337.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

public record AdminOrderResponse(
    long id,
    String orderNumber,
    String customerName,
    String customerEmail,
    String customerPhone,
    String customerPhoneSecondary,
    String fulfillment,
    String shippingAddress,
    String postalCode,
    String status,
    BigDecimal totalAmount,
    LocalDateTime createdAt,
    boolean awaitingConfirmation,
    List<AdminOrderItemResponse> items) {}
