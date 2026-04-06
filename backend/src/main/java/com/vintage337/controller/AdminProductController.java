package com.vintage337.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.vintage337.catalog.ProductCategories;
import com.vintage337.dto.CreateProductRequest;
import com.vintage337.dto.ProductResponse;
import com.vintage337.dto.ProductVariantRequest;
import com.vintage337.entity.Product;
import com.vintage337.repository.ProductRepository;
import jakarta.validation.Valid;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api/admin/products")
public class AdminProductController {

  private final ProductRepository productRepository;
  private final ObjectMapper objectMapper;

  public AdminProductController(ProductRepository productRepository, ObjectMapper objectMapper) {
    this.productRepository = productRepository;
    this.objectMapper = objectMapper;
  }

  @PostMapping
  @ResponseStatus(HttpStatus.CREATED)
  public ProductResponse create(@Valid @RequestBody CreateProductRequest req) {
    Product p = new Product();
    applyRequestToProduct(p, req);
    p.setActive(true);
    try {
      return ProductResponse.fromEntity(productRepository.save(p));
    } catch (Exception e) {
      throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Could not save product.");
    }
  }

  @PutMapping("/{id}")
  public ProductResponse update(@PathVariable long id, @Valid @RequestBody CreateProductRequest req) {
    Product p =
        productRepository
            .findById(id)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Product not found."));
    applyRequestToProduct(p, req);
    try {
      return ProductResponse.fromEntity(productRepository.save(p));
    } catch (Exception e) {
      throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Could not save product.");
    }
  }

  /**
   * Soft-delete: hides the product from active listings; order history keeps referencing the row.
   */
  @DeleteMapping("/{id}")
  @ResponseStatus(HttpStatus.NO_CONTENT)
  public void delete(@PathVariable long id) {
    Product p =
        productRepository
            .findById(id)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Product not found."));
    p.setActive(false);
    productRepository.save(p);
  }

  private void applyRequestToProduct(Product p, CreateProductRequest req) {
    String category = req.category().trim();
    if (!ProductCategories.isAllowed(category)) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid category.");
    }
    List<String> urls =
        req.imageUrls().stream().map(String::trim).filter(s -> !s.isEmpty()).toList();
    if (urls.isEmpty()) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "At least one image URL is required.");
    }
    int totalStock = req.variants().stream().mapToInt(ProductVariantRequest::stock).sum();

    List<Map<String, Object>> variantRows =
        req.variants().stream()
            .map(
                v -> {
                  Map<String, Object> m = new LinkedHashMap<>();
                  m.put("size", v.size().trim());
                  m.put("color", v.color().trim());
                  m.put("stock", v.stock());
                  return m;
                })
            .toList();

    try {
      String galleryJson = objectMapper.writeValueAsString(urls);
      String variantsJson = objectMapper.writeValueAsString(variantRows);
      p.setName(req.name().trim());
      p.setCategory(category);
      p.setPrice(req.price());
      p.setStock(totalStock);
      String desc = req.description();
      p.setDescription(desc == null || desc.isBlank() ? null : desc.trim());
      p.setImageUrl(urls.get(0));
      p.setGalleryJson(galleryJson);
      p.setVariantsJson(variantsJson);
    } catch (Exception e) {
      throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Could not save product.");
    }
  }
}
