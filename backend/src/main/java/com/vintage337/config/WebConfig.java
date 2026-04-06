package com.vintage337.config;

import com.vintage337.service.FileStorageService;
import java.nio.file.Path;
import java.util.Arrays;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class WebConfig implements WebMvcConfigurer {

  private final FileStorageService fileStorageService;

  @Value("${app.cors.allowed-origins:http://localhost:4200,http://127.0.0.1:4200}")
  private String corsAllowedOrigins;

  public WebConfig(FileStorageService fileStorageService) {
    this.fileStorageService = fileStorageService;
  }

  @Override
  public void addResourceHandlers(ResourceHandlerRegistry registry) {
    Path uploadRoot = fileStorageService.getProductsDirectory().getParent();
    String location = uploadRoot.toAbsolutePath().normalize().toUri().toString();
    if (!location.endsWith("/")) {
      location = location + "/";
    }
    registry.addResourceHandler("/uploads/**").addResourceLocations(location);
  }

  @Override
  public void addCorsMappings(CorsRegistry registry) {
    String[] origins =
        Arrays.stream(corsAllowedOrigins.split(","))
            .map(String::trim)
            .filter(s -> !s.isEmpty())
            .toArray(String[]::new);
    registry
        .addMapping("/api/**")
        .allowedOrigins(origins)
        .allowedMethods("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS")
        .allowedHeaders("*");
  }
}
