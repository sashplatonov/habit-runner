package com.sashplatonov.habbit.runner.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import io.quarkus.hibernate.orm.panache.PanacheEntityBase;

import java.time.Instant;

@Entity
@Table(name = "sync_op_logs")
public class SyncOpLogEntity extends PanacheEntityBase {
  @Id
  @Column(name = "opId", nullable = false)
  public String opId;

  @Column(name = "createdAt", nullable = false)
  public Instant createdAt;

  @PrePersist
  void prePersist() {
    if (createdAt == null) {
      createdAt = Instant.now();
    }
  }
}
