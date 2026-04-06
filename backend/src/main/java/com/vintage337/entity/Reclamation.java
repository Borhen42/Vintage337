package com.vintage337.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import java.time.LocalDateTime;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "reclamations")
@Getter
@Setter
@NoArgsConstructor
public class Reclamation {

  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "user_id")
  private User user;

  @Column(nullable = false, length = 255)
  private String email;

  @Column(name = "full_name", length = 200)
  private String fullName;

  @Column(nullable = false, length = 255)
  private String subject;

  @Column(nullable = false, columnDefinition = "TEXT")
  private String message;

  @Column(nullable = false, length = 32)
  private String status = "OPEN";

  @Column(name = "admin_reply", columnDefinition = "TEXT")
  private String adminReply;

  @Column(name = "replied_at")
  private LocalDateTime repliedAt;

  @Column(name = "created_at", nullable = false)
  private LocalDateTime createdAt;

  @PrePersist
  void prePersist() {
    createdAt = LocalDateTime.now();
  }
}
