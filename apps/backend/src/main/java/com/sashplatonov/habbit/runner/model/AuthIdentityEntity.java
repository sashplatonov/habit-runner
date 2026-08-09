package com.sashplatonov.habbit.runner.model;

import com.sashplatonov.habbit.runner.auth.identity.AuthProvider;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.Setter;

@Entity
@Table(name = "auth_identities")
@Getter
@Setter
public class AuthIdentityEntity extends UuidAuditedEntityBase {
  @Enumerated(EnumType.STRING)
  @Column(nullable = false, length = 32)
  private AuthProvider provider;

  @Column(name = "providerSubject", nullable = false, length = 512)
  private String providerSubject;

  @Column(name = "userId", nullable = false)
  private String userId;

  @Column
  private String email;
}
