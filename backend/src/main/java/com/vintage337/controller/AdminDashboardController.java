package com.vintage337.controller;

import com.vintage337.dto.AdminDashboardStatsResponse;
import com.vintage337.service.AdminDashboardService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/admin/dashboard")
public class AdminDashboardController {

  private final AdminDashboardService adminDashboardService;

  public AdminDashboardController(AdminDashboardService adminDashboardService) {
    this.adminDashboardService = adminDashboardService;
  }

  @GetMapping("/stats")
  public AdminDashboardStatsResponse stats() {
    return adminDashboardService.getStats();
  }
}
