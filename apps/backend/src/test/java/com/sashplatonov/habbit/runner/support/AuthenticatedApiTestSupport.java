package com.sashplatonov.habbit.runner.support;

import com.auth0.jwt.JWT;
import com.auth0.jwt.algorithms.Algorithm;
import com.sashplatonov.habbit.runner.model.UserEntity;
import jakarta.inject.Inject;
import jakarta.persistence.EntityManager;
import jakarta.transaction.HeuristicMixedException;
import jakarta.transaction.HeuristicRollbackException;
import jakarta.transaction.RollbackException;
import jakarta.transaction.Status;
import jakarta.transaction.SystemException;
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

  @Inject
  protected EntityManager entityManager;

  @AfterEach
  void cleanDatabase() throws Exception {
    finishActiveTransaction();
    inTransaction(() -> {
      entityManager.createNativeQuery("SET REFERENTIAL_INTEGRITY FALSE").executeUpdate();
      entityManager.createNativeQuery("TRUNCATE TABLE checkins").executeUpdate();
      entityManager.createNativeQuery("TRUNCATE TABLE habits").executeUpdate();
      entityManager.createNativeQuery("TRUNCATE TABLE refresh_tokens").executeUpdate();
      entityManager.createNativeQuery("TRUNCATE TABLE users").executeUpdate();
      entityManager.createNativeQuery("TRUNCATE TABLE tombstones").executeUpdate();
      entityManager.createNativeQuery("TRUNCATE TABLE sync_op_logs").executeUpdate();
      entityManager.createNativeQuery("SET REFERENTIAL_INTEGRITY TRUE").executeUpdate();
      return null;
    });
  }

  protected AuthenticatedUser createAuthenticatedUser() throws Exception {
    return createAuthenticatedUser("cloud");
  }

  protected AuthenticatedUser createAuthenticatedUser(String theme) throws Exception {
    var userId = UUID.randomUUID().toString();
    var email = userId + "@test.com";

    inTransaction(() -> {
      var user = new UserEntity();
      user.setId(userId);
      user.setEmail(email);
      user.setTheme(theme);
      user.markCreatedAt(Instant.now());
      user.persist();
      return null;
    });

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
    boolean transactionOwner = ut.getStatus() != Status.STATUS_ACTIVE;
    if (transactionOwner) {
      ut.begin();
    }
    boolean committed = false;
    try {
      var result = callable.call();
      if (transactionOwner) {
        ut.commit();
        committed = true;
      }
      return result;
    } finally {
      if (transactionOwner && !committed) {
        rollbackIfNeeded();
      }
    }
  }

  protected void rollbackIfNeeded() throws Exception {
    var status = ut.getStatus();
    if (status == Status.STATUS_ACTIVE || status == Status.STATUS_MARKED_ROLLBACK) {
      ut.rollback();
    }
  }

  private void finishActiveTransaction() throws Exception {
    if (ut.getStatus() != Status.STATUS_ACTIVE) {
      return;
    }
    try {
      ut.commit();
    } catch (
        RollbackException
            | HeuristicMixedException
            | HeuristicRollbackException
            | SecurityException
            | IllegalStateException
            | SystemException ex
    ) {
      rollbackIfNeeded();
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
