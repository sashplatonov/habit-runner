package com.sashplatonov.habbit.runner.auth.service;

import com.sashplatonov.habbit.runner.model.RefreshTokenEntity;
import com.sashplatonov.habbit.runner.repository.RefreshTokenRepository;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.ws.rs.NotAuthorizedException;
import lombok.extern.slf4j.Slf4j;

import java.time.Instant;

@ApplicationScoped
@Slf4j
public class RefreshTokenService {
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
    if (record == null || !record.isActiveAt(now())) {
      throw new NotAuthorizedException("Refresh token expired or revoked");
    }
    return record;
  }

  public void revoke(String token) {
    var record = findByToken(token);
    if (record != null) {
      record.revoke();
      log.info("event=auth_token_revoked, userId={}", record.getUserId());
    }
  }

  public String create(String token, String userId, int refreshTokenDays) {
    var refresh = newRefreshToken();
    refresh.setToken(token);
    refresh.setUserId(userId);
    refresh.setRevoked(false);
    refresh.setExpiry(now().plusSeconds((long) refreshTokenDays * 24 * 60 * 60));
    persistRefreshToken(refresh);
    return token;
  }

  protected RefreshTokenEntity findByToken(String token) {
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

  protected Instant now() {
    return Instant.now();
  }
}
