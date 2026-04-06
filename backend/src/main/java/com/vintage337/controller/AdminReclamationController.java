package com.vintage337.controller;

import com.vintage337.dto.ReclamationResponse;
import com.vintage337.dto.ReplyReclamationRequest;
import com.vintage337.service.ReclamationService;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/admin/reclamations")
public class AdminReclamationController {

  private final ReclamationService reclamationService;

  public AdminReclamationController(ReclamationService reclamationService) {
    this.reclamationService = reclamationService;
  }

  @GetMapping
  public List<ReclamationResponse> list() {
    return reclamationService.listForAdmin();
  }

  @PostMapping("/{id}/reply")
  public ReclamationResponse reply(@PathVariable long id, @Valid @RequestBody ReplyReclamationRequest body) {
    return reclamationService.reply(id, body);
  }
}
