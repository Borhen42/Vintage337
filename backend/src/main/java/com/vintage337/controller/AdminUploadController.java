package com.vintage337.controller;

import com.vintage337.dto.UploadUrlsResponse;
import com.vintage337.service.FileStorageService;
import java.io.IOException;
import java.util.ArrayList;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api/admin")
public class AdminUploadController {

  private static final int MAX_FILES = 12;

  private final FileStorageService fileStorageService;

  public AdminUploadController(FileStorageService fileStorageService) {
    this.fileStorageService = fileStorageService;
  }

  @PostMapping(value = "/uploads", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
  public UploadUrlsResponse upload(@RequestParam("files") List<MultipartFile> files) {
    if (files == null || files.isEmpty()) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "No files.");
    }
    if (files.size() > MAX_FILES) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Too many files.");
    }
    List<String> urls = new ArrayList<>();
    for (MultipartFile file : files) {
      if (file == null || file.isEmpty()) {
        continue;
      }
      String ct = file.getContentType();
      if (ct == null || !ct.startsWith("image/")) {
        throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Only image uploads are allowed.");
      }
      try {
        urls.add(fileStorageService.storeProductImage(file));
      } catch (IOException e) {
        throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Could not store file.");
      }
    }
    if (urls.isEmpty()) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "No usable files.");
    }
    return new UploadUrlsResponse(urls);
  }
}
