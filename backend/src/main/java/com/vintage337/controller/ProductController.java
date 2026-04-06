package com.vintage337.controller;

import com.vintage337.dto.ProductResponse;
import com.vintage337.entity.Product;
import com.vintage337.repository.ProductRepository;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api/products")
public class ProductController {

  private final ProductRepository productRepository;

  public ProductController(ProductRepository productRepository) {
    this.productRepository = productRepository;
  }

  @GetMapping
  public List<ProductResponse> listActive() {
    return productRepository.findByActiveTrueOrderByCreatedAtDesc().stream()
        .map(ProductResponse::fromEntity)
        .toList();
  }

  /**
   * Public detail by id. Intentionally does not re-check {@code active}: the row exists in the vault DB and
   * should resolve for deep links; the listing endpoints still filter to active-only.
   */
  @GetMapping("/{id}")
  public ProductResponse getOne(@PathVariable long id) {
    Product p =
        productRepository
            .findById(id)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Product not found."));
    return ProductResponse.fromEntity(p);
  }
}
