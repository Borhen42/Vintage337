package com.vintage337.dto;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.vintage337.entity.Product;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

final class ProductJson {

  private static final ObjectMapper MAPPER = new ObjectMapper();

  private ProductJson() {}

  static List<String> readGallery(Product p) {
    try {
      if (p.getGalleryJson() != null && !p.getGalleryJson().isBlank()) {
        return MAPPER.readValue(p.getGalleryJson(), new TypeReference<>() {});
      }
    } catch (Exception ignored) {
    }
    if (p.getImageUrl() != null && !p.getImageUrl().isBlank()) {
      return List.of(p.getImageUrl());
    }
    return List.of();
  }

  static List<ProductVariantResponse> readVariants(Product p) {
    try {
      if (p.getVariantsJson() != null && !p.getVariantsJson().isBlank()) {
        List<Map<String, Object>> raw =
            MAPPER.readValue(p.getVariantsJson(), new TypeReference<>() {});
        List<ProductVariantResponse> out = new ArrayList<>();
        for (Map<String, Object> row : raw) {
          if (row == null) continue;
          Object sz = row.get("size");
          Object co = row.get("color");
          Object st = row.get("stock");
          if (sz == null || co == null || st == null) continue;
          int stock =
              st instanceof Number n
                  ? n.intValue()
                  : Integer.parseInt(String.valueOf(st).trim());
          out.add(
              new ProductVariantResponse(
                  String.valueOf(sz).trim(), String.valueOf(co).trim(), stock));
        }
        return out;
      }
    } catch (Exception ignored) {
    }
    return List.of();
  }
}
