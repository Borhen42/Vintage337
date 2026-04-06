package com.vintage337.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.math.BigDecimal;
import java.util.List;

public record CreateOrderRequest(
    @NotBlank @Size(max = 200) String customerName,
    @NotBlank @Email String customerEmail,
    @Size(max = 64) String customerPhone,
    @Size(max = 64) String customerPhoneSecondary,
    @Size(max = 32) String fulfillment,
    @NotEmpty @Valid List<CreateOrderLineRequest> items,
    @NotNull BigDecimal totalAmount) {}
