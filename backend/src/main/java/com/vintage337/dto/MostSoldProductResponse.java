package com.vintage337.dto;

/** Top product by line-item quantity on revenue-eligible orders (confirmed fulfilment pipeline). */
public record MostSoldProductResponse(
    long productId, String productName, long unitsSold, String imageUrl) {}
