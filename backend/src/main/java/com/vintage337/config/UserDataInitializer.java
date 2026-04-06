package com.vintage337.config;

import com.vintage337.entity.User;
import com.vintage337.entity.UserRole;
import com.vintage337.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.password.PasswordEncoder;

@Configuration
public class UserDataInitializer {

  private static final Logger log = LoggerFactory.getLogger(UserDataInitializer.class);

  @Bean
  CommandLineRunner seedVintage337Users(UserRepository users, PasswordEncoder encoder) {
    return args -> {
      if (users.count() > 0) {
        return;
      }
      User admin = new User();
      admin.setEmail("admin@vintage337.com");
      admin.setPasswordHash(encoder.encode("heritage337"));
      admin.setFullName("Archive Admin");
      admin.setRole(UserRole.ADMIN);

      User member = new User();
      member.setEmail("user@vintage337.com");
      member.setPasswordHash(encoder.encode("heritage337"));
      member.setFullName("Heritage Member");
      member.setRole(UserRole.CUSTOMER);

      users.save(admin);
      users.save(member);
      log.info(
          "Seeded default users: admin@vintage337.com (ADMIN) and user@vintage337.com (CUSTOMER); password: heritage337");
    };
  }
}
