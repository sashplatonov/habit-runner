package com.habittracker.auth;

import com.habittracker.model.RefreshTokenEntity;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.ws.rs.NotAuthorizedException;

import java.time.Instant;

@ApplicationScoped
public class RefreshTokenService {

  public RefreshTokenEntity requireActive(String token) {
    var record = (RefreshTokenEntity) RefreshTokenEntity.find("token", token).firstResult();
    if (record == null || !record.isActiveAt(Instant.now())) {
      throw new NotAuthorizedException("Refresh token expired or revoked");
    }
    return record;
  }

  public void revoke(String token) {
    var record = (RefreshTokenEntity) RefreshTokenEntity.find("token", token).firstResult();
    if (record != null) {
      record.revoke();
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
}
