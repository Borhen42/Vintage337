package com.vintage337.controller;

import com.vintage337.model.HealthStatus;
import com.vintage337.service.HealthService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api")
public class HealthController {

  private final HealthService healthService;

  public HealthController(HealthService healthService) {
    this.healthService = healthService;
  }

  @GetMapping("/health")
  public HealthStatus health() {
    return healthService.getStatus();
  }
}
