package com.sashplatonov.habbit.runner.auth;

import com.sashplatonov.habbit.runner.auth.access.OAuthStateAccess;
import com.sashplatonov.habbit.runner.auth.access.UserAccess;
import com.sashplatonov.habbit.runner.auth.client.GoogleOAuthClient;
import com.sashplatonov.habbit.runner.auth.config.AuthConfig;
import com.sashplatonov.habbit.runner.auth.resource.AuthResource;
import com.sashplatonov.habbit.runner.auth.resource.AuthThemeResource;
import com.sashplatonov.habbit.runner.auth.security.AuthGuardFilter;
import com.sashplatonov.habbit.runner.auth.security.BearerTokenExtractor;
import com.sashplatonov.habbit.runner.auth.security.CurrentUser;
import com.sashplatonov.habbit.runner.auth.security.CurrentUserContext;
import com.sashplatonov.habbit.runner.auth.security.CsrfGuardFilter;
import com.sashplatonov.habbit.runner.auth.security.JwtUtil;
import com.sashplatonov.habbit.runner.auth.security.RequireAuth;
import com.sashplatonov.habbit.runner.auth.service.AuthService;
import com.sashplatonov.habbit.runner.auth.service.PreferencesService;
import com.sashplatonov.habbit.runner.auth.service.RefreshTokenService;
import com.sashplatonov.habbit.runner.auth.service.UserService;
import com.sashplatonov.habbit.runner.auth.support.AuthCollaborators;
import com.sashplatonov.habbit.runner.auth.support.AuthCookieBuilder;
import com.sashplatonov.habbit.runner.auth.support.AuthSupport;
import com.sashplatonov.habbit.runner.auth.support.RefreshTokenDigest;
import com.sashplatonov.habbit.runner.auth.support.OAuthCallbackSession;
import com.sashplatonov.habbit.runner.auth.support.OAuthHelper;
import com.sashplatonov.habbit.runner.auth.support.OAuthSupport;
import com.sashplatonov.habbit.runner.auth.support.ThemeCatalog;
import com.sashplatonov.habbit.runner.model.RefreshTokenEntity;
import com.sashplatonov.habbit.runner.model.UserEntity;
import com.sashplatonov.habbit.runner.support.RecordingAuthService;
import com.sashplatonov.habbit.runner.support.RecordingJwtUtil;
import com.sashplatonov.habbit.runner.support.RecordingOAuthSupport;
import com.sashplatonov.habbit.runner.support.RecordingRefreshTokenService;
import com.sashplatonov.habbit.runner.support.RecordingUserService;
import jakarta.ws.rs.NotAuthorizedException;
import jakarta.ws.rs.container.ContainerRequestContext;
import org.junit.jupiter.api.Test;

import java.lang.reflect.Proxy;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertSame;
import static org.junit.jupiter.api.Assertions.assertThrows;

class AuthDelegateCoverageTest {

  @Test
  void shouldDelegateCollaboratorOperationsToUnderlyingServices() {
    var jwtUtil = new RecordingJwtUtil();
    var refreshTokenService = new RecordingRefreshTokenService();
    var oauthSupport = new RecordingOAuthSupport();
    var userService = new RecordingUserService();
    var collaborators = new AuthCollaborators(jwtUtil, refreshTokenService, oauthSupport, userService);

    var refreshRecord = new RefreshTokenEntity();
    refreshRecord.setTokenHash(RefreshTokenDigest.hash("refresh-token"));
    refreshRecord.setFamilyId("family-1");
    refreshTokenService.setRequireActiveResult(refreshRecord);

    var existingUser = new UserEntity();
    existingUser.setId("user-1");
    existingUser.setEmail("user@example.test");
    userService.setUserResult(existingUser);

    assertSame(jwtUtil, collaborators.getJwtUtil());
    assertSame(refreshTokenService, collaborators.getRefreshTokenService());
    assertSame(userService, collaborators.getUserService());
    assertSame(refreshRecord, collaborators.requireActiveRefreshToken("refresh-token"));
    collaborators.revokeRefreshToken("refresh-token");
    assertEquals("refresh-token", refreshTokenService.getRevokedToken());
    assertEquals("created-refresh", collaborators.createRefreshToken("seed", "user-1", 30));
    assertEquals("seed", refreshTokenService.getCreatedToken());
    assertEquals("verified-user", collaborators.verifyToken("access-token").id());
    assertEquals("access::user-1::user@example.test::3600", collaborators.createAccessToken("user-1", "user@example.test", 3600));
    assertEquals("/dashboard", collaborators.normalizeReturnTo("/dashboard"));
    assertEquals("https://accounts.example.test/start?state=state-123", collaborators.buildAuthorizationUrl("state-123"));
    assertEquals("oauth@example.test", collaborators.exchangeCodeForEmail("code-123"));
    assertSame(existingUser, collaborators.findOrCreateUser("user@example.test"));
    assertEquals(
      "https://app.example.test/callback",
      collaborators.buildCallbackRedirect("/dashboard")
    );
  }

  @Test
  void shouldIssueTokenPairThroughCollaborators() {
    var jwtUtil = new RecordingJwtUtil();
    var refreshTokenService = new RecordingRefreshTokenService();
    var collaborators = new AuthCollaborators(
        jwtUtil,
        refreshTokenService,
        new RecordingOAuthSupport(),
        new RecordingUserService()
    );
    var user = new UserEntity();
    user.setId("user-1");
    user.setEmail("user@example.test");

    var tokenResponse = collaborators.issueTokenPair(user, 7200, 45);

    assertEquals("access::user-1::user@example.test::7200", tokenResponse.accessToken());
    assertEquals("created-refresh", tokenResponse.refreshToken());
    assertEquals(7200, tokenResponse.expiresIn());
    assertEquals("Bearer", tokenResponse.tokenType());
    assertEquals("user-1", refreshTokenService.getCreatedUserId());
    assertEquals(45, refreshTokenService.getCreatedDays());
  }

  @Test
  void shouldStoreCurrentUserWhenAuthGuardReceivesValidBearerToken() {
    var currentUserContext = new CurrentUserContext();
    var authService = new RecordingAuthService(new CurrentUser("user-1", "user@example.test"));
    var filter = new AuthGuardFilter(authService, currentUserContext);

    filter.filter(requestContext("Bearer signed-token"));

    assertEquals("signed-token", authService.seenToken);
    assertEquals("user-1", currentUserContext.requireUser().id());
    assertEquals("user@example.test", currentUserContext.requireUser().email());
  }

  @Test
  void shouldRejectMissingBearerTokenWhenAuthGuardFiltersRequest() {
    var filter = new AuthGuardFilter(new RecordingAuthService(new CurrentUser("user-1", "user@example.test")), new CurrentUserContext());

    assertThrows(NotAuthorizedException.class, () -> filter.filter(requestContext(null)));
  }

  private ContainerRequestContext requestContext(String authorizationHeader) {
    return (ContainerRequestContext) Proxy.newProxyInstance(
        ContainerRequestContext.class.getClassLoader(),
        new Class<?>[]{ContainerRequestContext.class},
        (proxy, method, args) -> {
          if ("getHeaderString".equals(method.getName()) && "Authorization".equals(args[0])) {
            return authorizationHeader;
          }
          return defaultValue(method.getReturnType());
        }
    );
  }

  private Object defaultValue(Class<?> returnType) {
    if (!returnType.isPrimitive()) {
      return null;
    }
    return java.lang.reflect.Array.get(java.lang.reflect.Array.newInstance(returnType, 1), 0);
  }

  // Recording helpers moved to test support package: com.sashplatonov.habbit.runner.support
}
