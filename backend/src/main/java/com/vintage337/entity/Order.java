package com.vintage337.entity;

import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToMany;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "customer_orders")
@Getter
@Setter
@NoArgsConstructor
public class Order {

  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @Column(name = "order_number", nullable = false, unique = true, length = 32)
  private String orderNumber;

  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "user_id")
  private User user;

  @Column(name = "customer_email", length = 255)
  private String customerEmail;

  @Column(name = "customer_name", length = 200)
  private String customerName;

  @Column(name = "customer_phone", length = 64)
  private String customerPhone;

  @Column(name = "customer_phone_secondary", length = 64)
  private String customerPhoneSecondary;

  @Column(name = "fulfillment", length = 32)
  private String fulfillment;

  @Enumerated(EnumType.STRING)
  @Column(nullable = false, length = 32)
  private OrderStatus status = OrderStatus.PENDING;

  @Column(name = "total_amount", nullable = false, precision = 12, scale = 2)
  private BigDecimal totalAmount = BigDecimal.ZERO;

  @Column(name = "created_at", nullable = false)
  private LocalDateTime createdAt;

  @Column(name = "updated_at")
  private LocalDateTime updatedAt;

  @OneToMany(
      mappedBy = "order",
      cascade = CascadeType.ALL,
      orphanRemoval = true)
  private List<OrderItem> items = new ArrayList<>();

  @PrePersist
  void prePersist() {
    createdAt = LocalDateTime.now();
  }

  @PreUpdate
  void preUpdate() {
    updatedAt = LocalDateTime.now();
  }

  public void addItem(OrderItem item) {
    items.add(item);
    item.setOrder(this);
  }

  public void removeItem(OrderItem item) {
    items.remove(item);
    item.setOrder(null);
  }
}
