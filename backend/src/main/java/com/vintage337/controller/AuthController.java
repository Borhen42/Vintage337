package com.vintage337.controller;

import com.vintage337.dto.LoginRequest;
import com.vintage337.dto.LoginResponse;
import com.vintage337.dto.RegisterRequest;
import com.vintage337.service.DomainAuthService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

  private final DomainAuthService domainAuthService;

  public AuthController(DomainAuthService domainAuthService) {
    this.domainAuthService = domainAuthService;
  }

  @PostMapping("/login")
  public LoginResponse login(@Valid @RequestBody LoginRequest request) {
    return domainAuthService.login(request);
  }

  @PostMapping("/register")
  @ResponseStatus(HttpStatus.CREATED)
  public LoginResponse register(@Valid @RequestBody RegisterRequest request) {
    return domainAuthService.register(request);
  }
}
