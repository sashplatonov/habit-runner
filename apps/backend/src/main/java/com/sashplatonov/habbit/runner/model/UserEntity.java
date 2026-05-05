package com.sashplatonov.habbit.runner.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;

import java.time.Instant;

@Entity
@Table(name = "users")
public class UserEntity extends UuidAuditedEntityBase {
  @Column(nullable = false, unique = true)
  public String email;

  @Column(nullable = false)
  public String theme;

  @Column
  public String timezone;

  public String getEmail() {
    return email;
  }

  public void setEmail(String email) {
    this.email = email;
  }

  public String getTheme() {
    return theme;
  }

  public void setTheme(String theme) {
    this.theme = theme;
  }

  public String getTimezone() {
    return timezone;
  }

  public void setTimezone(String timezone) {
    this.timezone = timezone;
  }

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
