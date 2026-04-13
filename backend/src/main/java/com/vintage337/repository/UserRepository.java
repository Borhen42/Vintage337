package com.vintage337.repository;

import com.vintage337.entity.User;
import com.vintage337.entity.UserRole;
import java.time.LocalDateTime;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface UserRepository extends JpaRepository<User, Long> {

  Optional<User> findByEmailIgnoreCase(String email);

  long countByRole(UserRole role);

  @Query(
      "SELECT COUNT(u) FROM User u WHERE u.role = :role AND u.createdAt >= :from AND u.createdAt < :to")
  long countByRoleAndCreatedAtBetween(
      @Param("role") UserRole role,
      @Param("from") LocalDateTime from,
      @Param("to") LocalDateTime to);
}
