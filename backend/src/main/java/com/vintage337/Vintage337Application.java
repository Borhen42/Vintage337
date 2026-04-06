package com.vintage337;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.autoconfigure.security.servlet.UserDetailsServiceAutoConfiguration;

@SpringBootApplication(exclude = {UserDetailsServiceAutoConfiguration.class})
public class Vintage337Application {

  public static void main(String[] args) {
    SpringApplication.run(Vintage337Application.class, args);
  }
}
