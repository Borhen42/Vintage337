package com.vintage337.controller;

import com.vintage337.dto.AdminAttentionSummaryResponse;
import com.vintage337.dto.AdminNotificationFeedResponse;
import com.vintage337.dto.PendingOrderCountResponse;
import com.vintage337.dto.PendingOrderNoticeDto;
import com.vintage337.dto.PendingReclamationNoticeDto;
import com.vintage337.entity.Order;
import com.vintage337.entity.OrderStatus;
import com.vintage337.entity.Reclamation;
import com.vintage337.repository.OrderRepository;
import com.vintage337.repository.ReclamationRepository;
import java.util.List;
import org.springframework.data.domain.PageRequest;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/admin/notifications")
public class AdminNotificationController {

  private final OrderRepository orderRepository;
  private final ReclamationRepository reclamationRepository;

  public AdminNotificationController(
      OrderRepository orderRepository, ReclamationRepository reclamationRepository) {
    this.orderRepository = orderRepository;
    this.reclamationRepository = reclamationRepository;
  }

  /** Pending orders + réclamations without an admin reply (single poll for the admin shell). */
  @GetMapping("/summary")
  public AdminAttentionSummaryResponse summary() {
    long orders = orderRepository.countByStatus(OrderStatus.PENDING);
    long reclams = reclamationRepository.countAwaitingAdminReply();
    return new AdminAttentionSummaryResponse(orders, reclams);
  }

  /** Items to show in the admin notification panel. */
  @GetMapping("/feed")
  public AdminNotificationFeedResponse feed() {
    var page50 = PageRequest.of(0, 50);
    List<Order> pending =
        orderRepository.findPendingForNotifications(OrderStatus.PENDING, page50);
    List<Reclamation> reclams = reclamationRepository.findAwaitingAdminReplyLimited(page50);
    List<PendingOrderNoticeDto> orderDtos =
        pending.stream()
            .map(
                o ->
                    new PendingOrderNoticeDto(
                        o.getId(),
                        o.getOrderNumber(),
                        o.getCustomerName() == null ? "" : o.getCustomerName(),
                        o.getCreatedAt()))
            .toList();
    List<PendingReclamationNoticeDto> recDtos =
        reclams.stream()
            .map(
                r ->
                    new PendingReclamationNoticeDto(
                        r.getId(),
                        r.getEmail(),
                        r.getSubject(),
                        r.getCreatedAt()))
            .toList();
    return new AdminNotificationFeedResponse(orderDtos, recDtos);
  }

  /** Pending customer orders awaiting archivist acceptance. */
  @GetMapping({"/pending-orders", "/pending_orders"})
  public PendingOrderCountResponse pendingOrders() {
    return new PendingOrderCountResponse(orderRepository.countByStatus(OrderStatus.PENDING));
  }
}
