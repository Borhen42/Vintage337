package com.vintage337.catalog;

import java.util.Arrays;
import java.util.Collections;
import java.util.LinkedHashSet;
import java.util.Set;

/** Fixed taxonomy for admin product form (matches storefront filters). */
public final class ProductCategories {

  private static final Set<String> ALLOWED =
      Collections.unmodifiableSet(
          new LinkedHashSet<>(
              Arrays.asList(
                  "Hoodie",
                  "Sneakers",
                  "Shirt",
                  "T-shirt",
                  "Sweat pants",
                  "Jeans pants")));

  private ProductCategories() {}

  public static boolean isAllowed(String category) {
    if (category == null) return false;
    return ALLOWED.contains(category.trim());
  }

  public static Set<String> all() {
    return ALLOWED;
  }
}
