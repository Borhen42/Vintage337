package com.vintage337.service;

import java.io.IOException;
import java.io.InputStream;
import java.io.UncheckedIOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardCopyOption;
import java.util.Locale;
import java.util.UUID;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

@Service
public class FileStorageService {

  private final Path productsDir;

  public FileStorageService(@Value("${app.upload.dir:uploads}") String uploadDir) {
    Path root = Path.of(uploadDir).toAbsolutePath().normalize();
    this.productsDir = root.resolve("products");
    try {
      Files.createDirectories(this.productsDir);
    } catch (IOException e) {
      throw new UncheckedIOException(e);
    }
  }

  /**
   * Stores an image and returns a URL path served by {@code /uploads/products/...}.
   */
  public String storeProductImage(MultipartFile file) throws IOException {
    String original = file.getOriginalFilename();
    String ext = extension(original);
    String filename = UUID.randomUUID().toString().replace("-", "") + (ext.isEmpty() ? "" : "." + ext);
    Path dest = productsDir.resolve(filename);
    try (InputStream in = file.getInputStream()) {
      Files.copy(in, dest, StandardCopyOption.REPLACE_EXISTING);
    }
    return "/uploads/products/" + filename;
  }

  public Path getProductsDirectory() {
    return productsDir;
  }

  private static String extension(String filename) {
    if (filename == null || filename.isBlank()) return "";
    int dot = filename.lastIndexOf('.');
    if (dot < 0 || dot == filename.length() - 1) return "";
    return filename.substring(dot + 1).toLowerCase(Locale.ROOT);
  }
}
