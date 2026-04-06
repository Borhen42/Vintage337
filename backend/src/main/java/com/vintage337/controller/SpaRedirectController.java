package com.vintage337.controller;

import jakarta.servlet.http.HttpServletRequest;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.servlet.view.RedirectView;

/**
 * Angular routes (e.g. {@code /product/5}) live on the dev server (port 4200). If you open
 * {@code http://localhost:8080/product/5} by mistake, Spring would show a Whitelabel 404 — this controller
 * redirects those paths to the configured frontend base URL.
 */
@Controller
public class SpaRedirectController {

  @Value("${app.frontend.url:http://localhost:4200}")
  private String frontendUrl;

  private String targetFor(HttpServletRequest request) {
    String base = frontendUrl.endsWith("/") ? frontendUrl.substring(0, frontendUrl.length() - 1) : frontendUrl;
    String uri = request.getRequestURI();
    String query = request.getQueryString();
    String target = base + uri;
    if (query != null && !query.isEmpty()) {
      target = target + "?" + query;
    }
    return target;
  }

  @GetMapping("/product/{id}")
  public RedirectView productDetail(@PathVariable String id, HttpServletRequest request) {
    String base = frontendUrl.endsWith("/") ? frontendUrl.substring(0, frontendUrl.length() - 1) : frontendUrl;
    String query = request.getQueryString();
    String target = base + "/product/" + id;
    if (query != null && !query.isEmpty()) {
      target = target + "?" + query;
    }
    return new RedirectView(target);
  }

  @GetMapping({"/archive", "/catalogue", "/collection", "/cart", "/login", "/register"})
  public RedirectView topLevelSpa(HttpServletRequest request) {
    return new RedirectView(targetFor(request));
  }

  @GetMapping({"/admin", "/admin/*", "/admin/**"})
  public RedirectView adminSpa(HttpServletRequest request) {
    return new RedirectView(targetFor(request));
  }
}
