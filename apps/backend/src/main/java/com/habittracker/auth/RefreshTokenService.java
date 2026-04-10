package com.habittracker.auth;

import com.habittracker.model.RefreshTokenEntity;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.ws.rs.NotAuthorizedException;
import lombok.extern.slf4j.Slf4j;

import java.time.Instant;

@ApplicationScoped
@Slf4j
public class RefreshTokenService {
  public RefreshTokenEntity requireActive(String token) {
    var record = findByToken(token);
    if (record == null || !record.isActiveAt(Instant.now())) {
      log.warn("Refresh token rejected: reason=expired-or-revoked");
      throw new NotAuthorizedException("Refresh token expired or revoked");
    }
    return record;
  }

  public void revoke(String token) {
    var record = findByToken(token);
    if (record != null) {
      record.revoke();
      log.info("Refresh token revoked: userId={}", record.userId);
    }
  }

  public String create(String token, String userId, int refreshTokenDays) {
    var refresh = new RefreshTokenEntity();
    refresh.token = token;
    refresh.userId = userId;
    refresh.revoked = false;
    refresh.setExpiry(Instant.now().plusSeconds((long) refreshTokenDays * 24 * 60 * 60));
    refresh.persist();
    return token;
  }

  private RefreshTokenEntity findByToken(String token) {
    return RefreshTokenEntity.<RefreshTokenEntity>find("token", token).firstResult();
  }
}
