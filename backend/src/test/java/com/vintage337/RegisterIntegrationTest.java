package com.vintage337;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.vintage337.dto.RegisterRequest;
import com.vintage337.repository.UserRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

@SpringBootTest(
    properties = {
      "spring.datasource.url=jdbc:h2:mem:vintage337_test;DB_CLOSE_DELAY=-1;MODE=MySQL",
      "spring.datasource.driver-class-name=org.h2.Driver",
      "spring.datasource.username=sa",
      "spring.datasource.password="
    })
@AutoConfigureMockMvc
@ActiveProfiles("test")
class RegisterIntegrationTest {

  @Autowired private MockMvc mockMvc;
  @Autowired private ObjectMapper objectMapper;
  @Autowired private UserRepository userRepository;

  @Test
  void register_createsUserAndReturnsToken() throws Exception {
    var body =
        new RegisterRequest("Test Archivist", "archivist.integration@test.local", "password12");
    mockMvc
        .perform(
            post("/api/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(body)))
        .andExpect(status().isCreated())
        .andExpect(jsonPath("$.accessToken").isString())
        .andExpect(jsonPath("$.email").value("archivist.integration@test.local"))
        .andExpect(jsonPath("$.role").value("CUSTOMER"));

    assertThat(userRepository.findByEmailIgnoreCase("archivist.integration@test.local"))
        .isPresent();
  }
}
