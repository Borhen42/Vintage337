package com.vintage337.dto;

import com.vintage337.entity.Product;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

public record ProductResponse(
    long id,
    String name,
    String category,
    BigDecimal price,
    int stock,
    String description,
    String imageUrl,
    List<String> imageUrls,
    List<ProductVariantResponse> variants,
    LocalDateTime createdAt) {

  public static ProductResponse fromEntity(Product p) {
    List<String> gallery = ProductJson.readGallery(p);
    List<ProductVariantResponse> vars = ProductJson.readVariants(p);
    String primary = gallery.isEmpty() ? p.getImageUrl() : gallery.get(0);
    return new ProductResponse(
        p.getId(),
        p.getName(),
        p.getCategory(),
        p.getPrice(),
        p.getStock(),
        p.getDescription(),
        primary != null ? primary : "",
        gallery,
        vars,
        p.getCreatedAt());
  }
}
