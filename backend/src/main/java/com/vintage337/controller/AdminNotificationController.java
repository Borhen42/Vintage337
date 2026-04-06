package com.vintage337.controller;

import com.vintage337.dto.PendingOrderCountResponse;
import com.vintage337.entity.OrderStatus;
import com.vintage337.repository.OrderRepository;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/admin/notifications")
public class AdminNotificationController {

  private final OrderRepository orderRepository;

  public AdminNotificationController(OrderRepository orderRepository) {
    this.orderRepository = orderRepository;
  }

  /** Pending customer orders awaiting archivist acceptance. */
  @GetMapping({"/pending-orders", "/pending_orders"})
  public PendingOrderCountResponse pendingOrders() {
    return new PendingOrderCountResponse(orderRepository.countByStatus(OrderStatus.PENDING));
  }
}
