package com.vintage337.controller;

import com.vintage337.dto.AdminUserResponse;
import com.vintage337.dto.PatchUserBlockedRequest;
import com.vintage337.dto.PatchUserRoleRequest;
import com.vintage337.entity.UserRole;
import com.vintage337.service.AdminUserService;
import com.vintage337.service.JwtService;
import io.jsonwebtoken.Claims;
import jakarta.validation.Valid;
import java.util.List;
import java.util.Optional;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api/admin/users")
public class AdminUserController {

  private final AdminUserService adminUserService;
  private final JwtService jwtService;

  public AdminUserController(AdminUserService adminUserService, JwtService jwtService) {
    this.adminUserService = adminUserService;
    this.jwtService = jwtService;
  }

  @GetMapping
  public List<AdminUserResponse> list() {
    return adminUserService.list();
  }

  @PatchMapping("/{id}/role")
  public AdminUserResponse role(
      @PathVariable long id,
      @Valid @RequestBody PatchUserRoleRequest body,
      @RequestHeader(value = "Authorization", required = false) String authorization) {
    UserRole role;
    try {
      role = UserRole.valueOf(body.role().trim().toUpperCase());
    } catch (IllegalArgumentException e) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Role must be ADMIN or CUSTOMER.");
    }
    if (role != UserRole.ADMIN && role != UserRole.CUSTOMER) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Role must be ADMIN or CUSTOMER.");
    }
    return adminUserService.setRole(id, role, actorId(authorization));
  }

  @PatchMapping("/{id}/blocked")
  public AdminUserResponse blocked(
      @PathVariable long id,
      @Valid @RequestBody PatchUserBlockedRequest body,
      @RequestHeader(value = "Authorization", required = false) String authorization) {
    return adminUserService.setBlocked(id, body.blocked(), actorId(authorization));
  }

  @DeleteMapping("/{id}")
  @ResponseStatus(HttpStatus.NO_CONTENT)
  public void delete(
      @PathVariable long id, @RequestHeader(value = "Authorization", required = false) String authorization) {
    adminUserService.delete(id, actorId(authorization));
  }

  private Optional<Long> actorId(String authorization) {
    Optional<Claims> c = jwtService.parseAuthorizationHeader(authorization);
    return c.flatMap(jwtService::readUserId);
  }
}
