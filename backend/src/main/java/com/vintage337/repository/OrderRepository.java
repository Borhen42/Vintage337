package com.vintage337.repository;

import com.vintage337.entity.Order;
import com.vintage337.entity.OrderStatus;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

public interface OrderRepository extends JpaRepository<Order, Long> {

  Optional<Order> findByOrderNumber(String orderNumber);

  @Query(
      "SELECT DISTINCT o FROM Order o LEFT JOIN FETCH o.items i LEFT JOIN FETCH i.product ORDER BY o.createdAt DESC")
  List<Order> findAllWithItemsAndProducts();

  @Query(
      "SELECT DISTINCT o FROM Order o LEFT JOIN FETCH o.items i LEFT JOIN FETCH i.product WHERE o.id = :id")
  Optional<Order> findByIdWithItemsAndProducts(long id);

  long countByStatus(OrderStatus status);
}
