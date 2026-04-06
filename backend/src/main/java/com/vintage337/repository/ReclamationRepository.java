package com.vintage337.repository;

import com.vintage337.entity.Reclamation;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ReclamationRepository extends JpaRepository<Reclamation, Long> {

  List<Reclamation> findAllByOrderByCreatedAtDesc();
}
