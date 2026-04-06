package com.vintage337.service;

import com.vintage337.entity.User;
import com.vintage337.entity.UserRole;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Date;
import java.util.Optional;
import javax.crypto.SecretKey;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

@Service
public class JwtService {

  private final SecretKey key;
  private final long expirationHours;

  public JwtService(
      @Value("${jwt.secret}") String secret,
      @Value("${jwt.expiration-hours:24}") long expirationHours) {
    byte[] bytes = secret.getBytes(StandardCharsets.UTF_8);
    if (bytes.length < 32) {
      throw new IllegalStateException("jwt.secret must be at least 32 bytes (UTF-8)");
    }
    this.key = Keys.hmacShaKeyFor(bytes);
    this.expirationHours = expirationHours;
  }

  public String generateToken(User user) {
    Instant now = Instant.now();
    var builder =
        Jwts.builder()
            .subject(user.getEmail())
            .claim("role", user.getRole().name())
            .issuedAt(Date.from(now))
            .expiration(Date.from(now.plus(expirationHours, ChronoUnit.HOURS)));
    Long id = user.getId();
    if (id != null) {
      builder = builder.claim("uid", id);
    }
    return builder.signWith(key).compact();
  }

  public String getEmail(String token) {
    return parse(token).getSubject();
  }

  public UserRole getRole(String token) {
    return UserRole.valueOf(parse(token).get("role", String.class));
  }

  /** Bearer token from {@code Authorization} header, if valid. */
  public Optional<Claims> parseAuthorizationHeader(String authorization) {
    if (authorization == null || !authorization.startsWith("Bearer ")) {
      return Optional.empty();
    }
    String token = authorization.substring(7).trim();
    if (token.isEmpty()) {
      return Optional.empty();
    }
    try {
      return Optional.of(parse(token));
    } catch (Exception e) {
      return Optional.empty();
    }
  }

  public Optional<Long> readUserId(Claims claims) {
    Object uid = claims.get("uid");
    if (uid instanceof Number n) {
      return Optional.of(n.longValue());
    }
    return Optional.empty();
  }

  private Claims parse(String token) {
    return Jwts.parser().verifyWith(key).build().parseSignedClaims(token).getPayload();
  }
}
