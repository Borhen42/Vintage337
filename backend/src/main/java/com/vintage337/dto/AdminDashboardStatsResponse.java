package com.vintage337.dto;

import java.math.BigDecimal;

/**
 * Admin dashboard KPIs backed by {@link com.vintage337.service.AdminDashboardService}.
 */
public record AdminDashboardStatsResponse(
    long totalArchivists,
    double archivistGrowthPercent,
    BigDecimal revenueLast30Days,
    BigDecimal revenuePrior30Days,
    MostSoldProductResponse mostSoldProduct) {}
