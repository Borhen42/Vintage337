package com.vintage337.dto;

import java.time.LocalDateTime;

public record PendingOrderNoticeDto(
    long id, String orderNumber, String customerName, LocalDateTime createdAt) {}
