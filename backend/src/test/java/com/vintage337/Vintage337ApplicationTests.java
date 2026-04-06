package com.vintage337;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;

@SpringBootTest(
    properties = {
      "spring.datasource.url=jdbc:h2:mem:vintage337_test;DB_CLOSE_DELAY=-1;MODE=MySQL",
      "spring.datasource.driver-class-name=org.h2.Driver",
      "spring.datasource.username=sa",
      "spring.datasource.password="
    })
@ActiveProfiles("test")
class Vintage337ApplicationTests {

  @Test
  void contextLoads() {}
}
