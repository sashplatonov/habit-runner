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
    if (record == null || !record.isActiveAt(now())) {
      log.warn("event=auth_refresh_rejected, reason=expired-or-revoked");
      throw new NotAuthorizedException("Refresh token expired or revoked");
    }
    return record;
  }

  public void revoke(String token) {
    var record = findByToken(token);
    if (record != null) {
      record.revoke();
      log.info("event=auth_token_revoked, userId={}", record.userId);
    }
  }

  public String create(String token, String userId, int refreshTokenDays) {
    var refresh = newRefreshToken();
    refresh.token = token;
    refresh.userId = userId;
    refresh.revoked = false;
    refresh.setExpiry(now().plusSeconds((long) refreshTokenDays * 24 * 60 * 60));
    persistRefreshToken(refresh);
    return token;
  }

  protected RefreshTokenEntity findByToken(String token) {
    return RefreshTokenEntity.<RefreshTokenEntity>find("token", token).firstResult();
  }

  protected RefreshTokenEntity newRefreshToken() {
    return new RefreshTokenEntity();
  }

  protected void persistRefreshToken(RefreshTokenEntity refresh) {
    refresh.persist();
  }

  protected Instant now() {
    return Instant.now();
  }
}
