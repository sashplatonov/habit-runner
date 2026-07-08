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
  private String email;

  @Column(nullable = false)
  private String theme;

  @Column
  private String timezone;

  @PrePersist
  void prePersist() {
    if (getTheme() == null || getTheme().isBlank()) {
      setTheme("cloud");
    }
  }

  public void markCreatedAt(Instant instant) {
    setCreatedAt(instant);
  }
}
