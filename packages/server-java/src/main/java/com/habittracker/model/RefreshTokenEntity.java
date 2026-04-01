package com.habittracker.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import io.quarkus.hibernate.orm.panache.PanacheEntityBase;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "refresh_tokens")
public class RefreshTokenEntity extends PanacheEntityBase {
  @Id
  @Column(nullable = false)
  public String id;

  @Column(nullable = false, unique = true)
  public String token;

  @Column(name = "userId", nullable = false)
  public String userId;

  @Column(nullable = false)
  public boolean revoked;

  @Column(name = "createdAt", nullable = false)
  public Instant createdAt;

  @Column(name = "expiresAt", nullable = false)
  public Instant expiresAt;

  @PrePersist
  void prePersist() {
    if (id == null || id.isBlank()) {
      id = UUID.randomUUID().toString();
    }
    if (createdAt == null) {
      createdAt = Instant.now();
    }
  }
}
