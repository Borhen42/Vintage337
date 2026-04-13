package com.vintage337.service;

import com.openhtmltopdf.pdfboxout.PdfRendererBuilder;
import com.vintage337.entity.Order;
import com.vintage337.entity.OrderItem;
import com.vintage337.entity.Product;
import java.io.ByteArrayOutputStream;
import java.io.InputStream;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.nio.charset.StandardCharsets;
import java.time.ZoneId;
import java.time.ZonedDateTime;
import java.time.format.DateTimeFormatter;
import java.util.Locale;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.ClassPathResource;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

@Service
public class CommandRecordPdfService {

  private static final DateTimeFormatter TIMESTAMP_FMT =
      DateTimeFormatter.ofPattern("dd MMM yyyy HH:mm zzz", Locale.ENGLISH);

  @Value("${app.public.url:http://localhost:8080}")
  private String publicBaseUrl;

  public byte[] render(Order order) {
    String template = loadTemplate();
    BigDecimal subtotal = computeSubtotal(order);
    BigDecimal archival = order.getTotalAmount().subtract(subtotal);
    if (archival.signum() < 0) {
      archival = BigDecimal.ZERO;
    }

    ZonedDateTime zdt = order.getCreatedAt().atZone(ZoneId.systemDefault());
    int y2 = order.getCreatedAt().getYear() % 100;
    long oid = order.getId() != null ? order.getId() : 0L;
    String archiveNo = String.format("%02d-%02d", y2, Math.floorMod(oid, 100));

    String sn = order.getOrderNumber().replace("V337-", "VNTC-337-");
    if (!sn.startsWith("VNTC-")) {
      sn = "VNTC-337-" + order.getOrderNumber();
    }

    String html =
        template
            .replace("{{KICKER}}", esc("HERITAGE ARCHIVE — OFFICIAL COMMAND RECORD"))
            .replace("{{COMMAND_TITLE}}", esc("COMMAND RECORD: ARCHIVE NO. " + archiveNo))
            .replace("{{SERIAL}}", esc(sn))
            .replace("{{TIMESTAMP}}", esc(zdt.format(TIMESTAMP_FMT)))
            .replace("{{REGISTRY_NAME}}", esc(order.getCustomerName()))
            .replace(
                "{{REGISTRY_EMAIL}}",
                esc(
                    order.getCustomerEmail() == null || order.getCustomerEmail().isBlank()
                        ? "—"
                        : order.getCustomerEmail()))
            .replace("{{PRIMARY_COMMS}}", esc(phoneOrDash(order.getCustomerPhone())))
            .replace("{{SECONDARY_COMMS}}", esc(phoneOrDash(order.getCustomerPhoneSecondary())))
            .replace(
                "{{SHIPPING_ADDRESS}}",
                esc(
                    order.getShippingAddress() == null || order.getShippingAddress().isBlank()
                        ? "—"
                        : order.getShippingAddress()))
            .replace(
                "{{POSTAL_CODE}}",
                esc(
                    order.getPostalCode() == null || order.getPostalCode().isBlank()
                        ? "—"
                        : order.getPostalCode()))
            .replace("{{ITEMS_BLOCK}}", buildItemsBlock(order))
            .replace(
                "{{AUTH_COPY}}",
                esc(
                    "This command record certifies that the listed heritage pieces were catalogued under "
                        + "Vintage337 archive protocol 337-A. Materials, provenance stamps, and dispatch routing "
                        + "are documented against the master vault ledger at the time of acceptance."))
            .replace("{{SIGNATURE_LINE}}", esc("E. Sterling — Archivist of record"))
            .replace(
                "{{SIGNATURE_ID}}",
                esc("Witness WR-" + String.format("%06d", Math.floorMod(oid, 1_000_000L))))
            .replace("{{PAYMENT_METHOD}}", esc(paymentLabel(order.getFulfillment())))
            .replace("{{BASE_COST}}", esc(money(subtotal)))
            .replace("{{ARCHIVAL_FEE}}", esc(money(archival)))
            .replace("{{TOTAL_VALUE}}", esc(money(order.getTotalAmount())))
            .replace("{{FOOTER_LEFT}}", esc("SECURED RECORD"))
            .replace(
                "{{FOOTER_RIGHT}}",
                esc(
                    "ACT "
                        + order.getCreatedAt().getYear()
                        + "-A017902-"
                        + String.format("%03d", Math.floorMod(oid, 1000L))));

    try (ByteArrayOutputStream os = new ByteArrayOutputStream()) {
      PdfRendererBuilder builder = new PdfRendererBuilder();
      builder.useFastMode();
      builder.withHtmlContent(html, null);
      builder.toStream(os);
      builder.run();
      return os.toByteArray();
    } catch (Exception e) {
      throw new ResponseStatusException(
          HttpStatus.INTERNAL_SERVER_ERROR, "Could not render command record PDF.");
    }
  }

  private static BigDecimal computeSubtotal(Order order) {
    BigDecimal sub = BigDecimal.ZERO;
    for (OrderItem i : order.getItems()) {
      sub =
          sub.add(
              i.getUnitPrice().multiply(BigDecimal.valueOf(i.getQuantity())));
    }
    return sub;
  }

  private String buildItemsBlock(Order order) {
    StringBuilder sb = new StringBuilder();
    for (OrderItem item : order.getItems()) {
      Product p = item.getProduct();
      String imgUrl = resolveImageUrl(p);
      String imgHtml;
      if (imgUrl.isEmpty()) {
        imgHtml =
            "<div class=\"thumb\" style=\"width:72px;height:72px;background:#ddd;border:1px solid #3d2314;\"></div>";
      } else {
        imgHtml = "<img class=\"thumb\" src=\"" + escAttr(imgUrl) + "\" alt=\"\" />";
      }
      String size =
          item.getVariantSize() == null || item.getVariantSize().isBlank()
              ? "—"
              : item.getVariantSize();
      String color =
          item.getVariantColor() == null || item.getVariantColor().isBlank()
              ? "—"
              : item.getVariantColor();
      String desc = shortDesc(p.getDescription());
      sb.append("<div class=\"garment\"><table class=\"g-row\" role=\"presentation\"><tr><td style=\"width:76px\">")
          .append(imgHtml)
          .append("</td><td class=\"g-body\"><p class=\"g-name\">")
          .append(esc(p.getName()))
          .append(" × ")
          .append(item.getQuantity())
          .append("</p><p class=\"g-desc\">")
          .append(esc(desc))
          .append("</p><span class=\"pill pill-dark\">")
          .append(esc(size.toUpperCase(Locale.ROOT)))
          .append("</span><span class=\"pill pill-tan\">")
          .append(esc(color.toUpperCase(Locale.ROOT)))
          .append("</span><table class=\"specs\" role=\"presentation\"><tr><td>Fabric density<span class=\"sv\">12 oz yard goods</span></td><td>Stitch info<span class=\"sv\">Lock-stitch heritage</span></td><td>Hardware grade<span class=\"sv\">Oxidized brass</span></td></tr></table></td></tr></table></div>");
    }
    return sb.toString();
  }

  private String resolveImageUrl(Product p) {
    String u = p.getImageUrl();
    if (u == null || u.isBlank()) {
      return "";
    }
    u = u.trim();
    if (u.startsWith("http://") || u.startsWith("https://")) {
      return u;
    }
    String base = publicBaseUrl.endsWith("/") ? publicBaseUrl.substring(0, publicBaseUrl.length() - 1) : publicBaseUrl;
    if (u.startsWith("/")) {
      return base + u;
    }
    return base + "/" + u;
  }

  private static String shortDesc(String d) {
    if (d == null || d.isBlank()) {
      return "Heavy-duty heritage construction. Authenticated and catalogued under Vintage337 vault standards.";
    }
    String t = d.trim().replaceAll("\\s+", " ");
    if (t.length() > 200) {
      return t.substring(0, 197) + "…";
    }
    return t;
  }

  private static String phoneOrDash(String s) {
    return s == null || s.isBlank() ? "—" : s.trim();
  }

  private static String paymentLabel(String fulfillment) {
    if (fulfillment == null || fulfillment.isBlank()) {
      return "ARCHIVE DESK SETTLEMENT";
    }
    return switch (fulfillment.trim().toLowerCase(Locale.ROOT)) {
      case "cod" -> "PAYMENT IN POST";
      case "pickup" -> "IN-STORE PICKUP";
      case "standard" -> "PAYMENT ON DELIVERY";
      default -> fulfillment.trim().toUpperCase(Locale.ROOT);
    };
  }

  /** Tunisian dinar (TND) — fr-TN style: comma decimal, space before currency symbol. */
  private static String money(BigDecimal n) {
    return n.setScale(2, RoundingMode.HALF_UP).toPlainString().replace('.', ',') + "\u00a0TND";
  }

  private static String esc(String s) {
    if (s == null) {
      return "";
    }
    return s.replace("&", "&amp;")
        .replace("<", "&lt;")
        .replace(">", "&gt;")
        .replace("\"", "&quot;");
  }

  private static String escAttr(String s) {
    return esc(s).replace("'", "&#39;");
  }

  private static String loadTemplate() {
    try {
      ClassPathResource res = new ClassPathResource("pdf/command-record.html");
      try (InputStream in = res.getInputStream()) {
        return new String(in.readAllBytes(), StandardCharsets.UTF_8);
      }
    } catch (Exception e) {
      throw new ResponseStatusException(
          HttpStatus.INTERNAL_SERVER_ERROR, "Command record template missing.");
    }
  }
}
