package com.vintage337.service;

import com.vintage337.dto.AdminUserResponse;
import com.vintage337.entity.User;
import com.vintage337.entity.UserRole;
import com.vintage337.repository.UserRepository;
import java.util.List;
import java.util.Optional;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
public class AdminUserService {

  private final UserRepository userRepository;

  public AdminUserService(UserRepository userRepository) {
    this.userRepository = userRepository;
  }

  @Transactional(readOnly = true)
  public List<AdminUserResponse> list() {
    return userRepository.findAll(Sort.by(Sort.Direction.ASC, "email")).stream()
        .map(AdminUserService::toDto)
        .toList();
  }

  @Transactional
  public AdminUserResponse setRole(long userId, UserRole newRole, Optional<Long> actorId) {
    User user =
        userRepository
            .findById(userId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found."));
    if (user.getRole() == UserRole.ADMIN
        && newRole == UserRole.CUSTOMER
        && userRepository.countByRole(UserRole.ADMIN) <= 1) {
      throw new ResponseStatusException(HttpStatus.CONFLICT, "Cannot demote the last admin.");
    }
    user.setRole(newRole);
    return toDto(userRepository.save(user));
  }

  @Transactional
  public AdminUserResponse setBlocked(long userId, boolean blocked, Optional<Long> actorId) {
    if (actorId.isPresent() && actorId.get().equals(userId) && blocked) {
      throw new ResponseStatusException(HttpStatus.CONFLICT, "You cannot block your own account.");
    }
    User user =
        userRepository
            .findById(userId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found."));
    user.setBlocked(blocked);
    return toDto(userRepository.save(user));
  }

  @Transactional
  public void delete(long userId, Optional<Long> actorId) {
    if (actorId.isPresent() && actorId.get().equals(userId)) {
      throw new ResponseStatusException(HttpStatus.CONFLICT, "You cannot delete your own account.");
    }
    User user =
        userRepository
            .findById(userId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found."));
    if (user.getRole() == UserRole.ADMIN && userRepository.countByRole(UserRole.ADMIN) <= 1) {
      throw new ResponseStatusException(HttpStatus.CONFLICT, "Cannot delete the last admin account.");
    }
    userRepository.delete(user);
  }

  private static AdminUserResponse toDto(User u) {
    return new AdminUserResponse(
        u.getId(),
        u.getEmail(),
        u.getFullName() == null ? "" : u.getFullName(),
        u.getRole().name(),
        u.isBlocked(),
        u.getCreatedAt());
  }
}
