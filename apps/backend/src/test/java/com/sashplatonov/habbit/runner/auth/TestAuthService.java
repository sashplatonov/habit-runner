package com.sashplatonov.habbit.runner.auth;

import com.sashplatonov.habbit.runner.auth.service.AuthService;
import com.sashplatonov.habbit.runner.auth.service.OAuthAccountLinkService;
import com.sashplatonov.habbit.runner.auth.support.AuthRateLimitService;
import com.sashplatonov.habbit.runner.metrics.instrumentation.ServiceMetricsInstrumentation;
import com.sashplatonov.habbit.runner.model.OAuthStateEntity;
import com.sashplatonov.habbit.runner.model.UserEntity;
import com.sashplatonov.habbit.runner.support.TestConfigFactory;

import java.time.Instant;
import java.lang.reflect.Field;

import static org.mockito.Mockito.mock;

final class TestAuthService extends AuthService {
  private final TestOAuthStateAccess oauthStateAccess;
  private final TestAuthJwtUtil jwtUtil;
  private final TestAuthRefreshTokenService refreshTokenService;
  private final TestAuthUserService userService;
  private final TestOAuthSupport oauthSupport;
  private final TestIdentityService identityService;
  private Instant currentTime = Instant.parse("2026-04-10T13:00:00Z");

  private TestAuthService(
      TestAuthJwtUtil jwtUtil,
      TestAuthRefreshTokenService refreshTokenService,
      TestAuthUserService userService,
      TestOAuthSupport oauthSupport,
      TestIdentityService identityService,
      TestOAuthStateAccess oauthStateAccess
  ) {
    super(
        TestConfigFactory.defaultAuthConfig(),
        jwtUtil,
        refreshTokenService,
        userService,
        oauthSupport,
        identityService,
        oauthStateAccess,
        new AuthRateLimitService(),
        mock(ServiceMetricsInstrumentation.class),
        new OAuthAccountLinkService(userService)
    );
    this.jwtUtil = jwtUtil;
    this.refreshTokenService = refreshTokenService;
    this.userService = userService;
    this.oauthSupport = oauthSupport;
    this.identityService = identityService;
    this.oauthStateAccess = oauthStateAccess;
  }

  static TestAuthService create() {
    return new TestAuthService(
        new TestAuthJwtUtil(),
        new TestAuthRefreshTokenService(),
        new TestAuthUserService(),
        new TestOAuthSupport(),
        new TestIdentityService(),
        new TestOAuthStateAccess()
    );
  }

  TestAuthJwtUtil jwtUtil() {
    return jwtUtil;
  }

  TestAuthRefreshTokenService refreshTokenService() {
    return refreshTokenService;
  }

  TestAuthUserService userService() {
    return userService;
  }

  TestOAuthSupport oauthSupport() {
    return oauthSupport;
  }

  TestIdentityService identityService() {
    return identityService;
  }

  void setUserById(UserEntity userById) {
    userService.setUserById(userById);
  }

  void setOauthState(OAuthStateEntity oauthState) {
    oauthStateAccess.setOauthState(oauthState);
  }

  StoredState getStoredState() {
    return oauthStateAccess.getStoredState();
  }

  String getDeletedState() {
    return oauthStateAccess.getDeletedState();
  }

  void setCurrentTime(Instant currentTime) {
    this.currentTime = currentTime;
  }

  void setAccountLinkService(OAuthAccountLinkService linkService) {
    try {
      Field field = AuthService.class.getDeclaredField("oauthAccountLinkService");
      field.setAccessible(true);
      field.set(this, linkService);
    } catch (ReflectiveOperationException exception) {
      throw new AssertionError(exception);
    }
  }

  @Override
  protected Instant now() {
    return currentTime;
  }
}
