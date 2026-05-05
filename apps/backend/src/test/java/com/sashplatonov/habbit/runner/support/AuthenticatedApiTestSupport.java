package com.sashplatonov.habbit.runner.support;

import com.auth0.jwt.JWT;
import com.auth0.jwt.algorithms.Algorithm;
import com.sashplatonov.habbit.runner.model.CheckinEntity;
import com.sashplatonov.habbit.runner.model.HabitEntity;
import com.sashplatonov.habbit.runner.model.RefreshTokenEntity;
import com.sashplatonov.habbit.runner.model.SyncOpLogEntity;
import com.sashplatonov.habbit.runner.model.TombstoneEntity;
import com.sashplatonov.habbit.runner.model.UserEntity;
import jakarta.inject.Inject;
import jakarta.transaction.Status;
import jakarta.transaction.UserTransaction;
import org.junit.jupiter.api.AfterEach;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Date;
import java.util.UUID;

public abstract class AuthenticatedApiTestSupport {

  protected static final String TEST_SECRET = "test-secret-for-unit-tests-1234567890";
  protected static final String TEST_ISSUER = "habittracker-test";

  @Inject
  protected UserTransaction ut;

  @AfterEach
  void cleanDatabase() throws Exception {
    // Clean up test data after each test for isolation
    // Always start a fresh transaction to ensure cleanup works
    if (ut.getStatus() == Status.STATUS_ACTIVE) {
      // If a transaction is already active, commit it first to avoid conflicts
      try {
        ut.commit();
      } catch (Exception e) {
        // Ignore commit errors, try to rollback
        try { ut.rollback(); } catch (Exception ignored) {}
      }
    }
    
    ut.begin();
    try {
      CheckinEntity.deleteAll();
      HabitEntity.deleteAll();
      RefreshTokenEntity.deleteAll();
      UserEntity.deleteAll();
      TombstoneEntity.deleteAll();
      SyncOpLogEntity.deleteAll();
      ut.commit();
    } catch (Exception e) {
      rollbackIfNeeded();
      throw e;
    }
  }

  protected AuthenticatedUser createAuthenticatedUser() throws Exception {
    return createAuthenticatedUser("cloud");
  }

  protected AuthenticatedUser createAuthenticatedUser(String theme) throws Exception {
    var userId = UUID.randomUUID().toString();
    var email = userId + "@test.com";

    // Only manage transaction manually if one is not already active (e.g. from @Transactional)
    boolean transactionOwner = ut.getStatus() != Status.STATUS_ACTIVE;
    if (transactionOwner) {
      ut.begin();
    }
    try {
      var user = new UserEntity();
      user.setId(userId);
      user.setEmail(email);
      user.setTheme(theme);
      user.markCreatedAt(Instant.now());
      user.persist();
      if (transactionOwner) {
        ut.commit();
      }
    } catch (Exception e) {
      if (transactionOwner) {
        rollbackIfNeeded();
      }
      throw e;
    }

    return new AuthenticatedUser(userId, email, generateAccessToken(userId, email));
  }

  protected String generateAccessToken(String userId, String email) {
    var now = Instant.now();
    return JWT.create()
        .withSubject(userId)
        .withClaim("email", email)
        .withIssuer(TEST_ISSUER)
        .withIssuedAt(Date.from(now))
        .withExpiresAt(Date.from(now.plus(3600, ChronoUnit.SECONDS)))
        .sign(Algorithm.HMAC256(TEST_SECRET));
  }

  protected void inTransaction(TransactionalRunnable runnable) throws Exception {
    inTransaction(() -> {
      runnable.run();
      return null;
    });
  }

  protected <T> T inTransaction(TransactionalCallable<T> callable) throws Exception {
    // Only manage transaction manually if one is not already active (e.g. from @Transactional)
    boolean transactionOwner = ut.getStatus() != Status.STATUS_ACTIVE;
    if (transactionOwner) {
      ut.begin();
    }
    try {
      var result = callable.call();
      if (transactionOwner) {
        ut.commit();
      }
      return result;
    } catch (Exception e) {
      if (transactionOwner) {
        rollbackIfNeeded();
      }
      throw e;
    }
  }

  protected void rollbackIfNeeded() throws Exception {
    var status = ut.getStatus();
    if (status == Status.STATUS_ACTIVE || status == Status.STATUS_MARKED_ROLLBACK) {
      ut.rollback();
    }
  }

  public record AuthenticatedUser(String id, String email, String accessToken) {
    public String getId() {
      return id;
    }
  }

  @FunctionalInterface
  protected interface TransactionalCallable<T> {
    T call() throws Exception;
  }

  @FunctionalInterface
  protected interface TransactionalRunnable {
    void run() throws Exception;
  }
}