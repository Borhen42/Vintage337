package com.vintage337.config;

import com.vintage337.exception.EmailTakenException;
import java.util.Map;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.server.ResponseStatusException;

@RestControllerAdvice
public class ApiExceptionHandler {

  @ExceptionHandler(BadCredentialsException.class)
  public ResponseEntity<Map<String, String>> badCredentials() {
    return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
        .body(Map.of("message", "Invalid email or password."));
  }

  @ExceptionHandler(EmailTakenException.class)
  public ResponseEntity<Map<String, String>> emailTaken(EmailTakenException ex) {
    return ResponseEntity.status(HttpStatus.CONFLICT).body(Map.of("message", ex.getMessage()));
  }

  @ExceptionHandler(DataIntegrityViolationException.class)
  public ResponseEntity<Map<String, String>> dataIntegrity(DataIntegrityViolationException ex) {
    String msg = ex.getMessage() != null && ex.getMessage().contains("uk_users_email")
        ? "This email is already registered."
        : "Could not save account. Please check your details and try again.";
    return ResponseEntity.status(HttpStatus.CONFLICT).body(Map.of("message", msg));
  }

  @ExceptionHandler(ResponseStatusException.class)
  public ResponseEntity<Map<String, String>> responseStatus(ResponseStatusException ex) {
    String msg = ex.getReason() != null ? ex.getReason() : "Request failed.";
    return ResponseEntity.status(ex.getStatusCode()).body(Map.of("message", msg));
  }

  @ExceptionHandler(MethodArgumentNotValidException.class)
  public ResponseEntity<Map<String, String>> validation(MethodArgumentNotValidException ex) {
    String msg =
        ex.getBindingResult().getFieldErrors().stream()
            .findFirst()
            .map(e -> e.getDefaultMessage())
            .orElse("Invalid request.");
    return ResponseEntity.badRequest().body(Map.of("message", msg));
  }
}
