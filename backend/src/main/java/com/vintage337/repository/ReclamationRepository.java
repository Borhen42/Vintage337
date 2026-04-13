package com.vintage337.repository;

import com.vintage337.entity.Reclamation;
import java.util.List;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

public interface ReclamationRepository extends JpaRepository<Reclamation, Long> {

  List<Reclamation> findAllByOrderByCreatedAtDesc();

  @Query(
      value =
          "SELECT COUNT(*) FROM reclamations WHERE admin_reply IS NULL OR TRIM(admin_reply) = ''",
      nativeQuery = true)
  long countAwaitingAdminReply();

  @Query(
      "SELECT r FROM Reclamation r WHERE r.adminReply IS NULL OR TRIM(r.adminReply) = '' "
          + "ORDER BY r.createdAt DESC")
  List<Reclamation> findAwaitingAdminReplyLimited(Pageable pageable);
}
