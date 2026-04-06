package com.vintage337.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.MapsId;
import jakarta.persistence.OneToOne;
import jakarta.persistence.Table;
import java.time.LocalDateTime;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "order_command_records")
@Getter
@Setter
@NoArgsConstructor
public class OrderCommandRecord {

  @Id
  @Column(name = "order_id")
  private Long orderId;

  @OneToOne(fetch = FetchType.LAZY)
  @MapsId
  @JoinColumn(name = "order_id")
  private Order order;

  /** PDF bytes — PostgreSQL BYTEA (not oid: avoid @Lob on byte[] with Hibernate 6). */
  @JdbcTypeCode(SqlTypes.VARBINARY)
  @Column(name = "pdf", nullable = false)
  private byte[] pdf;

  @Column(name = "filename", nullable = false, length = 255)
  private String filename;

  @Column(name = "generated_at", nullable = false)
  private LocalDateTime generatedAt = LocalDateTime.now();
}
