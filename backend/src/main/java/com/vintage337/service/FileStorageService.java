package com.vintage337.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.UUID;

@Service
public class FileStorageService {

    @Value("${supabase.url}")
    private String supabaseUrl;

    @Value("${supabase.bucket}")
    private String bucket;

    @Value("${supabase.key}")
    private String apiKey;

    private final RestTemplate restTemplate = new RestTemplate();

    /**
     * Upload image to Supabase and return public URL
     */
    public String storeProductImage(MultipartFile file) throws IOException {

        // ✅ Validate file
        if (file.isEmpty()) {
            throw new RuntimeException("File is empty");
        }

        // ✅ Generate unique filename
        String fileName = UUID.randomUUID() + "-" + file.getOriginalFilename();

        // ✅ Upload endpoint
        String uploadUrl = supabaseUrl + "/storage/v1/object/" + bucket + "/" + fileName;

        // ✅ Headers with secret key
        HttpHeaders headers = new HttpHeaders();
        headers.set("Authorization", "Bearer " + apiKey);
        headers.setContentType(MediaType.APPLICATION_OCTET_STREAM);

        // ✅ Request body
        HttpEntity<byte[]> request = new HttpEntity<>(file.getBytes(), headers);

        // ✅ Send request
        ResponseEntity<String> response = restTemplate.exchange(
                uploadUrl,
                HttpMethod.POST,
                request,
                String.class
        );

        // ❌ Handle failure
        if (!response.getStatusCode().is2xxSuccessful()) {
            throw new RuntimeException("Failed to upload image to Supabase");
        }

        // ✅ Return public URL (save this in DB)
        return supabaseUrl + "/storage/v1/object/public/" + bucket + "/" + fileName;
    }
}