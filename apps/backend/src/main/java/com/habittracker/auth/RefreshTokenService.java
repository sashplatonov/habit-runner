package com.habittracker.auth;

import com.habittracker.model.RefreshTokenEntity;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.ws.rs.NotAuthorizedException;
import org.jboss.logging.Logger;

import java.time.Instant;

@ApplicationScoped
public class RefreshTokenService {
  private static final Logger LOG = Logger.getLogger(RefreshTokenService.class);

  public RefreshTokenEntity requireActive(String token) {
    var record = findByToken(token);
    if (record == null || !record.isActiveAt(Instant.now())) {
      LOG.debug("Rejected inactive refresh token");
      throw new NotAuthorizedException("Refresh token expired or revoked");
    }
    return record;
  }

  public void revoke(String token) {
    var record = findByToken(token);
    if (record != null) {
      record.revoke();
      LOG.debugf("Revoked refresh token for userId=%s", record.userId);
    }
  }

  public String create(String token, String userId, int refreshTokenDays) {
    var refresh = new RefreshTokenEntity();
    refresh.token = token;
    refresh.userId = userId;
    refresh.revoked = false;
    refresh.setExpiry(Instant.now().plusSeconds((long) refreshTokenDays * 24 * 60 * 60));
    refresh.persist();
    LOG.debugf("Created refresh token for userId=%s", userId);
    return token;
  }

  private RefreshTokenEntity findByToken(String token) {
    return RefreshTokenEntity.<RefreshTokenEntity>find("token", token).firstResult();
  }
}
