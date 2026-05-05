package com.sashplatonov.habbit.runner.model;

import jakarta.persistence.Column;
import jakarta.persistence.Id;
import jakarta.persistence.MappedSuperclass;
import jakarta.persistence.PrePersist;
import lombok.Getter;
import lombok.Setter;

import java.util.UUID;

@MappedSuperclass
@Getter
@Setter
public abstract class UuidAuditedEntityBase extends AuditedEntityBase {
  @Id
  @Column(nullable = false)
  public String id;

  @PrePersist
  void prePersistUuidId() {
    if (!hasText(id)) {
      id = UUID.randomUUID().toString();
    }
  }

  protected boolean hasText(String value) {
    return value != null && !value.isBlank();
  }
}
