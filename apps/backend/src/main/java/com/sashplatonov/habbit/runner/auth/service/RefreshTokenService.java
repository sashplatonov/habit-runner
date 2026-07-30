package com.sashplatonov.habbit.runner.auth.service;

import com.sashplatonov.habbit.runner.auth.support.RefreshTokenDigest;
import com.sashplatonov.habbit.runner.auth.support.RefreshTokenRejectedException;
import com.sashplatonov.habbit.runner.auth.support.RefreshTokenRotationConflictException;
import com.sashplatonov.habbit.runner.auth.support.AuthSupport;
import com.sashplatonov.habbit.runner.model.RefreshTokenEntity;
import com.sashplatonov.habbit.runner.repository.RefreshTokenRepository;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import lombok.extern.slf4j.Slf4j;

import java.time.Instant;
import java.util.UUID;

@ApplicationScoped
@Slf4j
public class RefreshTokenService {
  private static final long ROTATION_REUSE_GRACE_SECONDS = 5L;
  private final RefreshTokenRepository refreshTokenRepository;

  public RefreshTokenService() {
    this(null);
  }

  @Inject
  public RefreshTokenService(RefreshTokenRepository refreshTokenRepository) {
    this.refreshTokenRepository = refreshTokenRepository;
  }

  public RefreshTokenEntity requireActive(String token) {
    var record = findByToken(token);
    if (record == null) {
      throw new RefreshTokenRejectedException();
    }
    if (record.isActiveAt(now())) {
      return record;
    }
    rejectInactive(record);
    throw new RefreshTokenRejectedException();
  }

  public void revoke(String token) {
    var record = findByToken(token);
    if (record != null) {
      revokeFamily(record.getFamilyId());
      log.info("event=auth_token_revoked, userId={}", record.getUserId());
    }
  }

  public String create(String token, String userId, int refreshTokenDays) {
    var refresh = newRefreshToken();
    refresh.setTokenHash(RefreshTokenDigest.hash(token));
    refresh.setFamilyId(UUID.randomUUID().toString());
    refresh.setUserId(userId);
    refresh.setRevoked(false);
    refresh.setExpiresAt(now().plusSeconds((long) refreshTokenDays * 24 * 60 * 60));
    persistRefreshToken(refresh);
    return token;
  }

  public String rotate(RefreshTokenEntity activeToken, int refreshTokenDays) {
    var rawToken = AuthSupport.randomToken(32);
    var next = newRefreshToken();
    next.setTokenHash(RefreshTokenDigest.hash(rawToken));
    next.setFamilyId(activeToken.getFamilyId());
    next.setUserId(activeToken.getUserId());
    next.setRevoked(false);
    next.setExpiresAt(now().plusSeconds((long) refreshTokenDays * 24 * 60 * 60));
    persistRefreshToken(next);
    activeToken.markRotated(next.getTokenHash(), now());
    return rawToken;
  }

  protected RefreshTokenEntity findByToken(String token) {
    if (token == null || token.isBlank()) {
      return null;
    }
    return refreshTokenRepository == null ? null : refreshTokenRepository.findByToken(token);
  }

  protected RefreshTokenEntity newRefreshToken() {
    return new RefreshTokenEntity();
  }

  protected void persistRefreshToken(RefreshTokenEntity refresh) {
    if (refreshTokenRepository != null) {
      refreshTokenRepository.save(refresh);
    }
  }

  protected void revokeFamily(String familyId) {
    if (refreshTokenRepository == null) {
      return;
    }
    refreshTokenRepository.findByFamilyId(familyId).forEach(RefreshTokenEntity::revoke);
  }

  private boolean shouldRevokeFamily(RefreshTokenEntity record) {
    return record.shouldRevokeFamily(now(), ROTATION_REUSE_GRACE_SECONDS);
  }

  private void rejectInactive(RefreshTokenEntity record) {
    if (!record.isRotated()) {
      return;
    }
    if (!shouldRevokeFamily(record)) {
      throw new RefreshTokenRotationConflictException();
    }
    revokeFamily(record.getFamilyId());
  }

  protected Instant now() {
    return Instant.now();
  }
}
