package com.sashplatonov.habbit.runner.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "sync_op_logs")
public class SyncOpLogEntity extends AuditedEntityBase {
  @Id
  @Column(name = "opId", nullable = false)
  public String opId;
}
