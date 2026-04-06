package com.vintage337.service;

import com.vintage337.model.HealthStatus;
import org.springframework.stereotype.Service;

@Service
public class HealthService {

  public HealthStatus getStatus() {
    return new HealthStatus("UP", "vintage337-backend");
  }
}
