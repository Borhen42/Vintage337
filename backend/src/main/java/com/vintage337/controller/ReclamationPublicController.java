package com.vintage337.controller;

import com.vintage337.dto.CreateReclamationRequest;
import com.vintage337.dto.ReclamationResponse;
import com.vintage337.service.JwtService;
import com.vintage337.service.ReclamationService;
import jakarta.validation.Valid;
import java.util.Optional;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/reclamations")
public class ReclamationPublicController {

  private final ReclamationService reclamationService;
  private final JwtService jwtService;

  public ReclamationPublicController(ReclamationService reclamationService, JwtService jwtService) {
    this.reclamationService = reclamationService;
    this.jwtService = jwtService;
  }

  @PostMapping
  @ResponseStatus(HttpStatus.CREATED)
  public ReclamationResponse create(
      @Valid @RequestBody CreateReclamationRequest body,
      @RequestHeader(value = "Authorization", required = false) String authorization) {
    Optional<Long> uid =
        jwtService.parseAuthorizationHeader(authorization).flatMap(jwtService::readUserId);
    return reclamationService.submit(body, uid);
  }
}
