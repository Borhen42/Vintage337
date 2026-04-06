package com.vintage337.entity;

public enum OrderStatus {
  PENDING,
  /** Admin confirmed; inventory deducted. */
  CONFIRMED,
  PROCESSING,
  SHIPPING,
  COMPLETED,
  CANCELLED,
}
