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
@Table(name = "push_subscriptions")
public class PushSubscriptionEntity extends PanacheEntityBase {
  @Id
  @Column(nullable = false)
  public String id;

  @Column(name = "userId", nullable = false)
  public String userId;

  @Column(nullable = false, unique = true)
  public String endpoint;

  @Column(nullable = false)
  public String p256dh;

  @Column(nullable = false)
  public String auth;

  @Column(name = "createdAt", nullable = false)
  public Instant createdAt;

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
