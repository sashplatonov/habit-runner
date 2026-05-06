package com.sashplatonov.habbit.runner.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.Setter;

import java.time.Instant;

@Entity
@Table(name = "users")
@Getter
@Setter
public class UserEntity extends UuidAuditedEntityBase {
  @Column(nullable = false, unique = true)
  public String email;

  @Column(nullable = false)
  public String theme;

  @Column
  public String timezone;

  @PrePersist
  void prePersist() {
    if (theme == null || theme.isBlank()) {
      theme = "cloud";
    }
  }

  public void markCreatedAt(Instant instant) {
    setCreatedAt(instant);
  }
}
