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
@Table(name = "users")
public class UserEntity extends PanacheEntityBase {
  @Id
  @Column(nullable = false)
  public String id;

  @Column(nullable = false, unique = true)
  public String email;

  @Column(nullable = false)
  public String theme;

  @Column
  public String timezone;

  @Column(name = "createdAt", nullable = false)
  public Instant createdAt;

  @PrePersist
  void prePersist() {
    if (id == null || id.isBlank()) {
      id = UUID.randomUUID().toString();
    }
    if (theme == null || theme.isBlank()) {
      theme = "cloud";
    }
    if (createdAt == null) {
      createdAt = Instant.now();
    }
  }

  public void markCreatedAt(Instant instant) {
    createdAt = instant;
  }
}
