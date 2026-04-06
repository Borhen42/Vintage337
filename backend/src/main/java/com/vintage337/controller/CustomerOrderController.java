package com.vintage337.controller;

import com.vintage337.dto.CreateOrderRequest;
import com.vintage337.dto.CustomerOrderResponse;
import com.vintage337.service.JwtService;
import com.vintage337.service.OrderService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/orders")
public class CustomerOrderController {

  private final OrderService orderService;
  private final JwtService jwtService;

  public CustomerOrderController(OrderService orderService, JwtService jwtService) {
    this.orderService = orderService;
    this.jwtService = jwtService;
  }

  @PostMapping
  @ResponseStatus(HttpStatus.CREATED)
  public CustomerOrderResponse create(
      @RequestHeader(value = "Authorization", required = false) String authorization,
      @Valid @RequestBody CreateOrderRequest body) {
    return orderService.create(body, jwtService.parseAuthorizationHeader(authorization));
  }
}
