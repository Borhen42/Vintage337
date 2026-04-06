package com.vintage337.service;

import com.vintage337.dto.LoginRequest;
import com.vintage337.dto.LoginResponse;
import com.vintage337.dto.RegisterRequest;
import com.vintage337.entity.User;
import com.vintage337.entity.UserRole;
import com.vintage337.exception.EmailTakenException;
import com.vintage337.repository.UserRepository;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class DomainAuthService {

  private final UserRepository userRepository;
  private final PasswordEncoder passwordEncoder;
  private final JwtService jwtService;

  public DomainAuthService(
      UserRepository userRepository,
      PasswordEncoder passwordEncoder,
      JwtService jwtService) {
    this.userRepository = userRepository;
    this.passwordEncoder = passwordEncoder;
    this.jwtService = jwtService;
  }

  @Transactional(readOnly = true)
  public LoginResponse login(LoginRequest request) {
    var user =
        userRepository
            .findByEmailIgnoreCase(request.email().trim())
            .orElseThrow(() -> new BadCredentialsException("Invalid email or password."));
    if (!passwordEncoder.matches(request.password(), user.getPasswordHash())) {
      throw new BadCredentialsException("Invalid email or password.");
    }
    if (user.isBlocked()) {
      throw new BadCredentialsException("Invalid email or password.");
    }
    String token = jwtService.generateToken(user);
    return new LoginResponse(token, "Bearer", user.getEmail(), user.getRole().name());
  }

  /**
   * Not @Transactional: {@code saveAndFlush} runs in the repository’s own transaction and commits
   * before JWT generation. If token creation failed inside one outer transaction, the insert would
   * roll back and the account would never persist.
   */
  public LoginResponse register(RegisterRequest request) {
    String normalized = request.email().trim().toLowerCase();
    if (userRepository.findByEmailIgnoreCase(normalized).isPresent()) {
      throw new EmailTakenException();
    }
    User user = new User();
    user.setEmail(normalized);
    user.setFullName(request.fullName().trim());
    user.setPasswordHash(passwordEncoder.encode(request.password()));
    user.setRole(UserRole.CUSTOMER);
    User saved = userRepository.saveAndFlush(user);
    String token = jwtService.generateToken(saved);
    return new LoginResponse(token, "Bearer", saved.getEmail(), saved.getRole().name());
  }
}
