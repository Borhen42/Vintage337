package com.vintage337.dto;

/** Lightweight counts for admin header / banner (polling). */
public record AdminAttentionSummaryResponse(long pendingOrders, long pendingReclamations) {}
