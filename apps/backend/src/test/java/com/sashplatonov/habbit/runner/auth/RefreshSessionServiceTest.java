package com.sashplatonov.habbit.runner.auth;

import com.sashplatonov.habbit.runner.auth.service.RefreshSessionService;
import com.sashplatonov.habbit.runner.auth.service.TokenIssuer;
import com.sashplatonov.habbit.runner.auth.support.AuthRateLimitException;
import com.sashplatonov.habbit.runner.auth.support.AuthRateLimitService;
import com.sashplatonov.habbit.runner.auth.support.RefreshTokenDigest;
import com.sashplatonov.habbit.runner.model.RefreshTokenEntity;
import com.sashplatonov.habbit.runner.support.TestConfigFactory;
import jakarta.ws.rs.NotAuthorizedException;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;

class RefreshSessionServiceTest {

  private RefreshSessionService service(
      TestAuthRefreshTokenService refreshTokenService,
      TestAuthUserService userService,
      TokenIssuer tokenIssuer
  ) {
    return new RefreshSessionService(
        refreshTokenService,
        userService,
        tokenIssuer,
        new AuthRateLimitService()
    );
  }

  private TokenIssuer tokenIssuer(TestAuthUserService userService) {
    return new TokenIssuer(
        new TestAuthJwtUtil(),
        new TestAuthRefreshTokenService(),
        TestConfigFactory.defaultAuthConfig(),
        userService
    );
  }

  private RefreshTokenEntity activeRecord(String userId) {
    var record = new RefreshTokenEntity();
    record.setTokenHash(RefreshTokenDigest.hash("refresh-token"));
    record.setFamilyId("family-1");
    record.setUserId(userId);
    return record;
  }

  @Test
  void shouldRefreshTokenWhenActiveRefreshRecordAndUserExist() {
    var refreshTokenService = new TestAuthRefreshTokenService();
    var userService = new TestAuthUserService();
    userService.setUserById(AuthServiceUnitCoverageTest.user("user-1", "user@example.test"));
    refreshTokenService.setActiveRefreshToken(activeRecord("user-1"));
    var service = service(refreshTokenService, userService, tokenIssuer(userService));

    var tokenResponse = service.refresh("refresh-token");

    assertEquals("access::user-1::user@example.test::3600", tokenResponse.accessToken());
    assertEquals("rotated-refresh", tokenResponse.refreshToken());
    assertEquals("user-1", tokenResponse.user().id());
    assertEquals("user@example.test", tokenResponse.user().email());
  }

  @Test
  void shouldRejectRefreshWhenUserNoLongerExists() {
    var refreshTokenService = new TestAuthRefreshTokenService();
    var userService = new TestAuthUserService();
    refreshTokenService.setActiveRefreshToken(activeRecord("missing-user"));
    var service = service(refreshTokenService, userService, tokenIssuer(userService));

    assertThrows(NotAuthorizedException.class, () -> service.refresh("refresh-token"));
  }

  @Test
  void shouldEnforceAccountRateLimitOnRefresh() {
    var refreshTokenService = new TestAuthRefreshTokenService();
    var userService = new TestAuthUserService();
    userService.setUserById(AuthServiceUnitCoverageTest.user("user-1", "user@example.test"));
    refreshTokenService.setActiveRefreshToken(activeRecord("user-1"));
    var service = service(refreshTokenService, userService, tokenIssuer(userService));

    for (var i = 0; i < 10; i++) {
      service.refresh("refresh-token");
    }

    assertThrows(AuthRateLimitException.class, () -> service.refresh("refresh-token"));
  }

  @Test
  void shouldDelegateTokenRevocationToRefreshTokenService() {
    var refreshTokenService = new TestAuthRefreshTokenService();
    var userService = new TestAuthUserService();
    var service = service(refreshTokenService, userService, tokenIssuer(userService));

    service.revoke("refresh-token");

    assertEquals("refresh-token", refreshTokenService.getRevokedToken());
  }
}
