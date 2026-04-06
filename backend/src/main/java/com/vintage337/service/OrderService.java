package com.vintage337.service;

import com.vintage337.dto.AdminOrderItemResponse;
import com.vintage337.dto.AdminOrderResponse;
import com.vintage337.dto.CreateOrderRequest;
import com.vintage337.dto.CustomerOrderResponse;
import com.vintage337.dto.OrderPdfResult;
import com.vintage337.entity.Order;
import com.vintage337.entity.OrderCommandRecord;
import com.vintage337.entity.OrderItem;
import com.vintage337.entity.OrderStatus;
import com.vintage337.entity.Product;
import com.vintage337.entity.User;
import com.vintage337.repository.OrderCommandRecordRepository;
import com.vintage337.repository.OrderRepository;
import com.vintage337.repository.ProductRepository;
import com.vintage337.repository.UserRepository;
import io.jsonwebtoken.Claims;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Objects;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;
import java.util.stream.Stream;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.dao.DataAccessException;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
public class OrderService {

  private static final Logger log = LoggerFactory.getLogger(OrderService.class);

  private final OrderRepository orderRepository;
  private final ProductRepository productRepository;
  private final UserRepository userRepository;
  private final ProductStockService productStockService;
  private final CommandRecordPdfService commandRecordPdfService;
  private final OrderCommandRecordRepository orderCommandRecordRepository;

  public OrderService(
      OrderRepository orderRepository,
      ProductRepository productRepository,
      UserRepository userRepository,
      ProductStockService productStockService,
      CommandRecordPdfService commandRecordPdfService,
      OrderCommandRecordRepository orderCommandRecordRepository) {
    this.orderRepository = orderRepository;
    this.productRepository = productRepository;
    this.userRepository = userRepository;
    this.productStockService = productStockService;
    this.commandRecordPdfService = commandRecordPdfService;
    this.orderCommandRecordRepository = orderCommandRecordRepository;
  }

  @Transactional
  public CustomerOrderResponse create(CreateOrderRequest req, Optional<Claims> authClaims) {
    Order order = new Order();
    order.setOrderNumber(newOrderNumber());
    order.setCustomerName(req.customerName().trim());
    order.setCustomerEmail(req.customerEmail().trim().toLowerCase());
    String phone = req.customerPhone();
    order.setCustomerPhone(phone == null || phone.isBlank() ? null : phone.trim());
    String phone2 = req.customerPhoneSecondary();
    order.setCustomerPhoneSecondary(phone2 == null || phone2.isBlank() ? null : phone2.trim());
    String ful = req.fulfillment();
    order.setFulfillment(ful == null || ful.isBlank() ? null : ful.trim());
    order.setStatus(OrderStatus.PENDING);
    order.setTotalAmount(req.totalAmount());

    authClaims
        .flatMap(OrderService::readUserIdFromClaims)
        .flatMap(userRepository::findById)
        .ifPresent(order::setUser);

    for (var line : req.items()) {
      Product p =
          productRepository
              .findById(line.productId())
              .orElseThrow(
                  () ->
                      new ResponseStatusException(
                          HttpStatus.BAD_REQUEST, "Product not found: " + line.productId()));
      if (!p.isActive()) {
        throw new ResponseStatusException(
            HttpStatus.BAD_REQUEST, "Product is not available: " + p.getName());
      }
      OrderItem oi = new OrderItem();
      oi.setProduct(p);
      oi.setQuantity(line.quantity());
      oi.setUnitPrice(line.unitPrice());
      String vs = line.variantSize();
      String vc = line.variantColor();
      oi.setVariantSize(vs == null || vs.isBlank() ? null : vs.trim());
      oi.setVariantColor(vc == null || vc.isBlank() ? null : vc.trim());
      order.addItem(oi);
    }

    Order saved = orderRepository.save(order);
    return new CustomerOrderResponse(saved.getId(), saved.getOrderNumber(), saved.getStatus().name());
  }

  private static Optional<Long> readUserIdFromClaims(Claims claims) {
    Object uid = claims.get("uid");
    if (uid instanceof Number n) {
      return Optional.of(n.longValue());
    }
    return Optional.empty();
  }

  @Transactional(readOnly = true)
  public List<AdminOrderResponse> listForAdmin() {
    List<Order> rows = ordersForAdminSorted();
    return rows.stream().map(this::toAdminResponse).toList();
  }

  /** UTF-8 CSV with BOM for spreadsheet apps; one row per order (contact + fulfilment + line summary). */
  @Transactional(readOnly = true)
  public byte[] exportShippingLogsCsv() {
    StringBuilder sb = new StringBuilder();
    sb.append('\uFEFF');
    sb.append(
        String.join(
            ",",
            csvCell("order_number"),
            csvCell("created_at"),
            csvCell("status"),
            csvCell("fulfillment"),
            csvCell("customer_name"),
            csvCell("customer_email"),
            csvCell("customer_phone"),
            csvCell("customer_phone_secondary"),
            csvCell("line_items"),
            csvCell("total_amount")));
    sb.append('\n');
    for (Order o : ordersForAdminSorted()) {
      sb.append(
          String.join(
              ",",
              csvCell(o.getOrderNumber()),
              csvCell(o.getCreatedAt() == null ? "" : o.getCreatedAt().toString()),
              csvCell(o.getStatus() == null ? "" : o.getStatus().name()),
              csvCell(o.getFulfillment()),
              csvCell(o.getCustomerName()),
              csvCell(o.getCustomerEmail()),
              csvCell(o.getCustomerPhone()),
              csvCell(o.getCustomerPhoneSecondary()),
              csvCell(lineItemsSummary(o)),
              csvCell(o.getTotalAmount() == null ? "" : o.getTotalAmount().toPlainString())));
      sb.append('\n');
    }
    return sb.toString().getBytes(StandardCharsets.UTF_8);
  }

  private List<Order> ordersForAdminSorted() {
    List<Order> rows = new ArrayList<>(orderRepository.findAllWithItemsAndProducts());
    rows.sort(
        Comparator.comparing((Order o) -> o.getStatus() != OrderStatus.PENDING)
            .thenComparing(Order::getCreatedAt, Comparator.nullsLast(Comparator.reverseOrder())));
    return rows;
  }

  private static String lineItemsSummary(Order o) {
    return o.getItems().stream()
        .map(
            i -> {
              Product p = i.getProduct();
              String name = p == null ? "?" : p.getName();
              StringBuilder part = new StringBuilder(name).append(" x").append(i.getQuantity());
              String vs = i.getVariantSize();
              String vc = i.getVariantColor();
              String v =
                  Stream.of(vs, vc)
                      .filter(Objects::nonNull)
                      .map(String::trim)
                      .filter(s -> !s.isEmpty())
                      .collect(Collectors.joining("/"));
              if (!v.isEmpty()) {
                part.append(" (").append(v).append(')');
              }
              return part.toString();
            })
        .collect(Collectors.joining("; "));
  }

  private static String csvCell(String s) {
    if (s == null) {
      return "";
    }
    String t = s.replace("\"", "\"\"");
    if (t.indexOf(',') >= 0
        || t.indexOf('"') >= 0
        || t.indexOf('\n') >= 0
        || t.indexOf('\r') >= 0) {
      return "\"" + t + "\"";
    }
    return t;
  }

  private AdminOrderResponse toAdminResponse(Order o) {
    List<AdminOrderItemResponse> items =
        o.getItems().stream()
            .map(
                i -> {
                  Product p = i.getProduct();
                  return new AdminOrderItemResponse(
                      p.getId(),
                      p.getName(),
                      i.getQuantity(),
                      i.getUnitPrice(),
                      i.getVariantSize(),
                      i.getVariantColor());
                })
            .toList();
    boolean awaiting = o.getStatus() == OrderStatus.PENDING;
    return new AdminOrderResponse(
        o.getId(),
        o.getOrderNumber(),
        o.getCustomerName(),
        o.getCustomerEmail(),
        o.getCustomerPhone(),
        o.getCustomerPhoneSecondary(),
        o.getFulfillment(),
        o.getStatus().name(),
        o.getTotalAmount(),
        o.getCreatedAt(),
        awaiting,
        items);
  }

  /**
   * Accepts a pending command: decrements stock, marks CONFIRMED, and builds the heritage command-record PDF.
   */
  @Transactional
  public OrderPdfResult acceptCommand(long orderId) {
    Order order =
        orderRepository
            .findByIdWithItemsAndProducts(orderId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Order not found."));
    if (order.getStatus() != OrderStatus.PENDING) {
      throw new ResponseStatusException(HttpStatus.CONFLICT, "This command is not awaiting acceptance.");
    }
    for (OrderItem item : order.getItems()) {
      Product p =
          productRepository
              .findById(item.getProduct().getId())
              .orElseThrow(
                  () ->
                      new ResponseStatusException(
                          HttpStatus.INTERNAL_SERVER_ERROR, "Missing product for order line."));
      productStockService.decrementForLine(
          p, item.getVariantSize(), item.getVariantColor(), item.getQuantity());
      productRepository.save(p);
    }
    order.setStatus(OrderStatus.CONFIRMED);
    orderRepository.save(order);
    byte[] pdf = commandRecordPdfService.render(order);
    String safeName = commandRecordFilename(order);
    persistCommandRecord(order, pdf, safeName);
    return new OrderPdfResult(safeName, pdf);
  }

  /**
   * Returns the sealed command record PDF from {@code order_command_records}, or renders once and stores it
   * for legacy rows confirmed before archival storage existed.
   */
  @Transactional
  public OrderPdfResult commandRecordPdf(long orderId) {
    Order order =
        orderRepository
            .findByIdWithItemsAndProducts(orderId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Order not found."));
    OrderStatus st = order.getStatus();
    if (st == OrderStatus.PENDING) {
      throw new ResponseStatusException(
          HttpStatus.CONFLICT, "Accept the command first to seal the folio and generate the record.");
    }
    if (st == OrderStatus.CANCELLED) {
      throw new ResponseStatusException(
          HttpStatus.CONFLICT, "Cancelled commands have no sealed command record.");
    }
    return orderCommandRecordRepository
        .findById(orderId)
        .map(r -> new OrderPdfResult(r.getFilename(), r.getPdf()))
        .orElseGet(
            () -> {
              byte[] pdf = commandRecordPdfService.render(order);
              String safeName = commandRecordFilename(order);
              persistCommandRecord(order, pdf, safeName);
              return new OrderPdfResult(safeName, pdf);
            });
  }

  private void persistCommandRecord(Order order, byte[] pdf, String filename) {
    try {
      OrderCommandRecord rec = new OrderCommandRecord();
      rec.setOrder(order);
      rec.setPdf(pdf);
      rec.setFilename(filename);
      rec.setGeneratedAt(LocalDateTime.now());
      orderCommandRecordRepository.save(rec);
      orderCommandRecordRepository.flush();
    } catch (DataAccessException ex) {
      int len = pdf == null ? 0 : pdf.length;
      log.warn(
          "Could not store command record PDF for order {} ({} bytes). "
              + "Increase MySQL max_allowed_packet (e.g. SET GLOBAL max_allowed_packet=67108864;). Cause: {}",
          order.getId(),
          len,
          ex.getMostSpecificCause().getMessage());
    }
  }

  private static String commandRecordFilename(Order order) {
    return "Vintage337-Command-"
        + order.getOrderNumber().replaceAll("[^A-Za-z0-9._-]", "_")
        + ".pdf";
  }

  @Transactional
  public AdminOrderResponse rejectCommand(long orderId) {
    Order order =
        orderRepository
            .findByIdWithItemsAndProducts(orderId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Order not found."));
    if (order.getStatus() != OrderStatus.PENDING) {
      throw new ResponseStatusException(HttpStatus.CONFLICT, "Only pending commands can be rejected.");
    }
    order.setStatus(OrderStatus.CANCELLED);
    orderRepository.save(order);
    return toAdminResponse(order);
  }

  private static String newOrderNumber() {
    return "V337-" + UUID.randomUUID().toString().replace("-", "").substring(0, 12).toUpperCase();
  }
}
