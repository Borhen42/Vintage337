package com.vintage337.service;

import com.vintage337.dto.CreateReclamationRequest;
import com.vintage337.dto.ReclamationResponse;
import com.vintage337.dto.ReplyReclamationRequest;
import com.vintage337.entity.Reclamation;
import com.vintage337.entity.User;
import com.vintage337.repository.ReclamationRepository;
import com.vintage337.repository.UserRepository;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
public class ReclamationService {

  private final ReclamationRepository reclamationRepository;
  private final UserRepository userRepository;

  public ReclamationService(ReclamationRepository reclamationRepository, UserRepository userRepository) {
    this.reclamationRepository = reclamationRepository;
    this.userRepository = userRepository;
  }

  @Transactional
  public ReclamationResponse submit(CreateReclamationRequest req, Optional<Long> linkedUserId) {
    Reclamation r = new Reclamation();
    r.setEmail(req.email().trim().toLowerCase());
    r.setFullName(req.fullName() == null || req.fullName().isBlank() ? null : req.fullName().trim());
    r.setSubject(req.subject().trim());
    r.setMessage(req.message().trim());
    r.setStatus("OPEN");
    linkedUserId.flatMap(userRepository::findById).ifPresent(r::setUser);
    return toDto(reclamationRepository.save(r));
  }

  @Transactional(readOnly = true)
  public List<ReclamationResponse> listForAdmin() {
    return reclamationRepository.findAllByOrderByCreatedAtDesc().stream().map(ReclamationService::toDto).toList();
  }

  @Transactional
  public ReclamationResponse reply(long id, ReplyReclamationRequest req) {
    Reclamation r =
        reclamationRepository
            .findById(id)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Reclamation not found."));
    r.setAdminReply(req.message().trim());
    r.setRepliedAt(LocalDateTime.now());
    r.setStatus("REPLIED");
    return toDto(reclamationRepository.save(r));
  }

  private static ReclamationResponse toDto(Reclamation r) {
    User u = r.getUser();
    Long uid = u == null ? null : u.getId();
    return new ReclamationResponse(
        r.getId(),
        uid,
        r.getEmail(),
        r.getFullName() == null ? "" : r.getFullName(),
        r.getSubject(),
        r.getMessage(),
        r.getStatus(),
        r.getAdminReply() == null ? "" : r.getAdminReply(),
        r.getRepliedAt(),
        r.getCreatedAt());
  }
}
