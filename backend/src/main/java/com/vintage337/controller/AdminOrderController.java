package com.vintage337.controller;

import com.vintage337.dto.AdminOrderResponse;
import com.vintage337.dto.OrderPdfResult;
import com.vintage337.service.OrderService;
import java.nio.charset.StandardCharsets;
import java.time.LocalDate;
import java.util.List;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/admin/orders")
public class AdminOrderController {

  private final OrderService orderService;

  public AdminOrderController(OrderService orderService) {
    this.orderService = orderService;
  }

  @GetMapping
  public List<AdminOrderResponse> list() {
    return orderService.listForAdmin();
  }

  @GetMapping(value = "/shipping-logs/export", produces = "text/csv;charset=UTF-8")
  public ResponseEntity<byte[]> exportShippingLogs() {
    byte[] csv = orderService.exportShippingLogsCsv();
    String filename = "Vintage337-shipping-logs-" + LocalDate.now() + ".csv";
    return ResponseEntity.ok()
        .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + filename + "\"")
        .contentType(new MediaType("text", "csv", StandardCharsets.UTF_8))
        .body(csv);
  }

  /** Accept: stock deduction + CONFIRMED + PDF download (heritage command record). */
  @PostMapping(value = "/{id}/accept", produces = MediaType.APPLICATION_PDF_VALUE)
  public ResponseEntity<byte[]> accept(@PathVariable long id) {
    OrderPdfResult r = orderService.acceptCommand(id);
    return ResponseEntity.ok()
        .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + r.filename() + "\"")
        .contentType(MediaType.APPLICATION_PDF)
        .body(r.pdfBytes());
  }

  /** Download the sealed heritage command record again (confirmed / in fulfilment / completed). */
  @GetMapping(value = "/{id}/command-record", produces = MediaType.APPLICATION_PDF_VALUE)
  public ResponseEntity<byte[]> commandRecord(@PathVariable long id) {
    OrderPdfResult r = orderService.commandRecordPdf(id);
    return ResponseEntity.ok()
        .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + r.filename() + "\"")
        .contentType(MediaType.APPLICATION_PDF)
        .body(r.pdfBytes());
  }

  @PostMapping("/{id}/reject")
  public AdminOrderResponse reject(@PathVariable long id) {
    return orderService.rejectCommand(id);
  }

  /** Cancel after accept (or any post-accept status): restores vault stock and removes the sealed record. */
  @PostMapping("/{id}/cancel")
  public AdminOrderResponse cancel(@PathVariable long id) {
    return orderService.cancelCommand(id);
  }
}
