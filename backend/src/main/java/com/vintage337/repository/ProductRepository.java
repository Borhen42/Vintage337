package com.vintage337.repository;

import com.vintage337.entity.Product;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ProductRepository extends JpaRepository<Product, Long> {

  List<Product> findByActiveTrueOrderByCreatedAtDesc();

  List<Product> findByActiveTrueAndCategoryContainingIgnoreCase(String category);
}
