package com.vintage337.repository;

import com.vintage337.entity.User;
import com.vintage337.entity.UserRole;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface UserRepository extends JpaRepository<User, Long> {

  Optional<User> findByEmailIgnoreCase(String email);

  long countByRole(UserRole role);
}
