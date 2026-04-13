package com.vintage337.service;

import com.vintage337.dto.AdminDashboardStatsResponse;
import com.vintage337.dto.MostSoldProductResponse;
import com.vintage337.entity.OrderStatus;
import com.vintage337.entity.UserRole;
import com.vintage337.repository.OrderRepository;
import com.vintage337.repository.UserRepository;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.List;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AdminDashboardService {

  private static final List<OrderStatus> REVENUE_STATUSES =
      List.of(
          OrderStatus.CONFIRMED,
          OrderStatus.PROCESSING,
          OrderStatus.SHIPPING,
          OrderStatus.COMPLETED);

  private final UserRepository userRepository;
  private final OrderRepository orderRepository;

  public AdminDashboardService(UserRepository userRepository, OrderRepository orderRepository) {
    this.userRepository = userRepository;
    this.orderRepository = orderRepository;
  }

  @Transactional(readOnly = true)
  public AdminDashboardStatsResponse getStats() {
    LocalDateTime now = LocalDateTime.now();
    LocalDateTime startLast30 = now.minusDays(30);
    LocalDateTime startPrior30 = now.minusDays(60);

    long totalArchivists = userRepository.countByRole(UserRole.CUSTOMER);
    long newLast30 =
        userRepository.countByRoleAndCreatedAtBetween(UserRole.CUSTOMER, startLast30, now);
    long newPrior30 =
        userRepository.countByRoleAndCreatedAtBetween(UserRole.CUSTOMER, startPrior30, startLast30);

    double archivistGrowthPercent =
        newPrior30 == 0 ? (newLast30 > 0 ? 100.0 : 0.0) : round1((newLast30 - newPrior30) * 100.0 / newPrior30);

    BigDecimal revenueLast30 =
        orderRepository.sumTotalAmountByStatusesBetween(REVENUE_STATUSES, startLast30, now);
    BigDecimal revenuePrior =
        orderRepository.sumTotalAmountByStatusesBetween(REVENUE_STATUSES, startPrior30, startLast30);

    MostSoldProductResponse mostSold = resolveMostSoldProduct();

    return new AdminDashboardStatsResponse(
        totalArchivists, archivistGrowthPercent, revenueLast30, revenuePrior, mostSold);
  }

  private MostSoldProductResponse resolveMostSoldProduct() {
    List<Object[]> rows = orderRepository.aggregateUnitsSoldByProduct(REVENUE_STATUSES);
    if (rows.isEmpty()) {
      return null;
    }
    Object[] r = rows.get(0);
    long productId = ((Number) r[0]).longValue();
    String name = r[1] != null ? String.valueOf(r[1]) : "";
    String img = r[2] != null ? String.valueOf(r[2]) : "";
    long units = ((Number) r[3]).longValue();
    if (units < 1 || name.isBlank()) {
      return null;
    }
    return new MostSoldProductResponse(productId, name, units, img);
  }

  private static double round1(double v) {
    return BigDecimal.valueOf(v).setScale(1, RoundingMode.HALF_UP).doubleValue();
  }
}
