package com.vintage337.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.vintage337.entity.Product;
import java.util.List;
import java.util.Map;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

@Service
public class ProductStockService {

  private final ObjectMapper objectMapper;

  public ProductStockService(ObjectMapper objectMapper) {
    this.objectMapper = objectMapper;
  }

  /**
   * Decrements variant row stock when variants JSON exists and both size/color are set; otherwise
   * decrements aggregate {@link Product#getStock()}. Throws 409 when not enough units.
   */
  public void decrementForLine(Product product, String variantSize, String variantColor, int quantity) {
    if (quantity <= 0) {
      return;
    }
    String size = normalizeVariant(variantSize);
    String color = normalizeVariant(variantColor);
    String json = product.getVariantsJson();
    boolean hasVariants = json != null && !json.isBlank();

    if (!hasVariants || size == null || color == null) {
      int stock = product.getStock() == null ? 0 : product.getStock();
      if (stock < quantity) {
        throw new ResponseStatusException(
            HttpStatus.CONFLICT, "Insufficient stock for \"" + product.getName() + "\".");
      }
      product.setStock(stock - quantity);
      return;
    }

    try {
      List<Map<String, Object>> rows =
          objectMapper.readValue(json, new TypeReference<List<Map<String, Object>>>() {});
      if (rows == null || rows.isEmpty()) {
        decrementAggregateOnly(product, quantity);
        return;
      }
      boolean matched = false;
      for (Map<String, Object> row : rows) {
        if (row == null) continue;
        String rs = normalizeVariant(String.valueOf(row.get("size")));
        String rc = normalizeVariant(String.valueOf(row.get("color")));
        if (rs == null || rc == null) continue;
        if (!rs.equalsIgnoreCase(size) || !rc.equalsIgnoreCase(color)) continue;
        int st = parseStock(row.get("stock"));
        if (st < quantity) {
          throw new ResponseStatusException(
              HttpStatus.CONFLICT, "Insufficient stock for \"" + product.getName() + "\" (" + size + " / " + color + ").");
        }
        row.put("stock", st - quantity);
        matched = true;
        break;
      }
      if (!matched) {
        throw new ResponseStatusException(
            HttpStatus.BAD_REQUEST,
            "No matching variant for \"" + product.getName() + "\" (" + variantSize + " / " + variantColor + ").");
      }
      product.setVariantsJson(objectMapper.writeValueAsString(rows));
      product.setStock(rows.stream().mapToInt(r -> parseStock(r.get("stock"))).sum());
    } catch (ResponseStatusException e) {
      throw e;
    } catch (Exception e) {
      throw new ResponseStatusException(
          HttpStatus.INTERNAL_SERVER_ERROR, "Could not update variant inventory for \"" + product.getName() + "\".");
    }
  }

  private void decrementAggregateOnly(Product product, int quantity) {
    int stock = product.getStock() == null ? 0 : product.getStock();
    if (stock < quantity) {
      throw new ResponseStatusException(
          HttpStatus.CONFLICT, "Insufficient stock for \"" + product.getName() + "\".");
    }
    product.setStock(stock - quantity);
  }

  /**
   * Restores units to variant row or aggregate stock (inverse of {@link #decrementForLine}). Used when an
   * accepted command is cancelled.
   */
  public void incrementForLine(Product product, String variantSize, String variantColor, int quantity) {
    if (quantity <= 0) {
      return;
    }
    String size = normalizeVariant(variantSize);
    String color = normalizeVariant(variantColor);
    String json = product.getVariantsJson();
    boolean hasVariants = json != null && !json.isBlank();

    if (!hasVariants || size == null || color == null) {
      int stock = product.getStock() == null ? 0 : product.getStock();
      product.setStock(stock + quantity);
      return;
    }

    try {
      List<Map<String, Object>> rows =
          objectMapper.readValue(json, new TypeReference<List<Map<String, Object>>>() {});
      if (rows == null || rows.isEmpty()) {
        incrementAggregateOnly(product, quantity);
        return;
      }
      boolean matched = false;
      for (Map<String, Object> row : rows) {
        if (row == null) continue;
        String rs = normalizeVariant(String.valueOf(row.get("size")));
        String rc = normalizeVariant(String.valueOf(row.get("color")));
        if (rs == null || rc == null) continue;
        if (!rs.equalsIgnoreCase(size) || !rc.equalsIgnoreCase(color)) continue;
        int st = parseStock(row.get("stock"));
        row.put("stock", st + quantity);
        matched = true;
        break;
      }
      if (!matched) {
        throw new ResponseStatusException(
            HttpStatus.BAD_REQUEST,
            "No matching variant to restore for \"" + product.getName() + "\" (" + variantSize + " / " + variantColor + ").");
      }
      product.setVariantsJson(objectMapper.writeValueAsString(rows));
      product.setStock(rows.stream().mapToInt(r -> parseStock(r.get("stock"))).sum());
    } catch (ResponseStatusException e) {
      throw e;
    } catch (Exception e) {
      throw new ResponseStatusException(
          HttpStatus.INTERNAL_SERVER_ERROR, "Could not restore variant inventory for \"" + product.getName() + "\".");
    }
  }

  private void incrementAggregateOnly(Product product, int quantity) {
    int stock = product.getStock() == null ? 0 : product.getStock();
    product.setStock(stock + quantity);
  }

  private static String normalizeVariant(String raw) {
    if (raw == null) return null;
    String t = raw.trim();
    if (t.isEmpty()) return null;
    if (t.equalsIgnoreCase("OS")) return null;
    if (t.equalsIgnoreCase("Default")) return null;
    return t;
  }

  private static int parseStock(Object st) {
    if (st instanceof Number n) {
      return n.intValue();
    }
    return Integer.parseInt(String.valueOf(st).trim());
  }
}
