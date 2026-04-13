package com.vintage337.repository;

import com.vintage337.entity.Order;
import com.vintage337.entity.OrderStatus;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Collection;
import java.util.List;
import java.util.Optional;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface OrderRepository extends JpaRepository<Order, Long> {

  Optional<Order> findByOrderNumber(String orderNumber);

  @Query(
      "SELECT DISTINCT o FROM Order o LEFT JOIN FETCH o.items i LEFT JOIN FETCH i.product ORDER BY o.createdAt DESC")
  List<Order> findAllWithItemsAndProducts();

  @Query(
      "SELECT DISTINCT o FROM Order o LEFT JOIN FETCH o.items i LEFT JOIN FETCH i.product WHERE o.id = :id")
  Optional<Order> findByIdWithItemsAndProducts(long id);

  long countByStatus(OrderStatus status);

  /**
   * Explicit JPQL avoids Spring Data parsing {@code …StatusOrderBy…} on the {@code Order} entity (the
   * {@code OrderBy} token is swallowed incorrectly).
   */
  @Query("SELECT o FROM Order o WHERE o.status = :status ORDER BY o.createdAt DESC")
  List<Order> findPendingForNotifications(@Param("status") OrderStatus status, Pageable pageable);

  @Query(
      "SELECT COALESCE(SUM(o.totalAmount), 0) FROM Order o WHERE o.status IN :statuses AND o.createdAt >= :from AND o.createdAt < :to")
  BigDecimal sumTotalAmountByStatusesBetween(
      @Param("statuses") Collection<OrderStatus> statuses,
      @Param("from") LocalDateTime from,
      @Param("to") LocalDateTime to);

  /**
   * Aggregate units sold per product for the given order statuses (e.g. confirmed pipeline). Ordered by
   * volume descending.
   */
  @Query(
      "SELECT i.product.id, i.product.name, i.product.imageUrl, SUM(i.quantity) FROM OrderItem i "
          + "JOIN i.order o WHERE o.status IN :statuses "
          + "GROUP BY i.product.id, i.product.name, i.product.imageUrl "
          + "ORDER BY SUM(i.quantity) DESC")
  List<Object[]> aggregateUnitsSoldByProduct(@Param("statuses") Collection<OrderStatus> statuses);
}
