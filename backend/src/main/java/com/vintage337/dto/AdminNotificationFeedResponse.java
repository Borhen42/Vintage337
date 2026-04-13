package com.vintage337.dto;

import java.util.List;

public record AdminNotificationFeedResponse(
    List<PendingOrderNoticeDto> pendingOrders,
    List<PendingReclamationNoticeDto> pendingReclamations) {}
