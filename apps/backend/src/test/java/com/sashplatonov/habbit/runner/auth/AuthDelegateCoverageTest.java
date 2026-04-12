package com.sashplatonov.habbit.runner.auth;

import com.sashplatonov.habbit.runner.auth.dto.TokenResponse;
import com.sashplatonov.habbit.runner.model.RefreshTokenEntity;
import com.sashplatonov.habbit.runner.model.UserEntity;
import com.sashplatonov.habbit.runner.support.TestConfigFactory;
import jakarta.ws.rs.NotAuthorizedException;
import jakarta.ws.rs.container.ContainerRequestContext;
import org.junit.jupiter.api.Test;

import java.lang.reflect.Proxy;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertSame;
import static org.junit.jupiter.api.Assertions.assertThrows;

@SuppressWarnings({"PMD.LawOfDemeter", "PMD.UnusedPrivateField"})
class AuthDelegateCoverageTest {

  @Test
  void shouldDelegateCollaboratorOperationsToUnderlyingServices() {
    var jwtUtil = new RecordingJwtUtil();
    var refreshTokenService = new RecordingRefreshTokenService();
    var oauthSupport = new RecordingOAuthSupport();
    var userService = new RecordingUserService();
    var collaborators = new AuthCollaborators(jwtUtil, refreshTokenService, oauthSupport, userService);

    var refreshRecord = new RefreshTokenEntity();
    refreshRecord.token = "refresh-token";
    refreshTokenService.requireActiveResult = refreshRecord;

    var existingUser = new UserEntity();
    existingUser.id = "user-1";
    existingUser.email = "user@example.test";
    userService.userResult = existingUser;

    assertSame(jwtUtil, collaborators.getJwtUtil());
    assertSame(refreshTokenService, collaborators.getRefreshTokenService());
    assertSame(userService, collaborators.getUserService());
    assertSame(refreshRecord, collaborators.requireActiveRefreshToken("refresh-token"));
    collaborators.revokeRefreshToken("refresh-token");
    assertEquals("refresh-token", refreshTokenService.revokedToken);
    assertEquals("created-refresh", collaborators.createRefreshToken("seed", "user-1", 30));
    assertEquals("seed", refreshTokenService.createdToken);
    assertEquals("verified-user", collaborators.verifyToken("access-token").id());
    assertEquals("access::user-1::user@example.test::3600", collaborators.createAccessToken("user-1", "user@example.test", 3600));
    assertEquals("/dashboard", collaborators.normalizeReturnTo("/dashboard"));
    assertEquals("https://accounts.example.test/start?state=state-123", collaborators.buildAuthorizationUrl("state-123"));
    assertEquals("oauth@example.test", collaborators.exchangeCodeForEmail("code-123"));
    assertSame(existingUser, collaborators.findOrCreateUser("user@example.test"));
    assertEquals(
        "https://app.example.test/callback?token=access-token&email=user@example.test",
        collaborators.buildCallbackRedirect(
            "/dashboard",
            new TokenResponse("access-token", "refresh-token", 3600, "Bearer"),
            "user@example.test"
        )
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
    user.id = "user-1";
    user.email = "user@example.test";

    var tokenResponse = collaborators.issueTokenPair(user, 7200, 45);

    assertEquals("access::user-1::user@example.test::7200", tokenResponse.accessToken());
    assertEquals("created-refresh", tokenResponse.refreshToken());
    assertEquals(7200, tokenResponse.expiresIn());
    assertEquals("Bearer", tokenResponse.tokenType());
    assertEquals("user-1", refreshTokenService.createdUserId);
    assertEquals(45, refreshTokenService.createdDays);
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

    var exception = assertThrows(NotAuthorizedException.class, () -> filter.filter(requestContext(null)));

    assertEquals(401, exception.getResponse().getStatus());
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

  private static final class RecordingJwtUtil extends JwtUtil {
    private String verifiedToken;

    RecordingJwtUtil() {
      super(TestConfigFactory.defaultAuthConfig());
    }

    @Override
    public String createAccessToken(String userId, String email, int ttlSeconds) {
      return "access::" + userId + "::" + email + "::" + ttlSeconds;
    }

    @Override
    public CurrentUser verify(String token) {
      verifiedToken = token;
      return new CurrentUser("verified-user", "verified@example.test");
    }
  }

  private static final class RecordingRefreshTokenService extends RefreshTokenService {
    private RefreshTokenEntity requireActiveResult;
    private String revokedToken;
    private String createdToken;
    private String createdUserId;
    private int createdDays;

    @Override
    public RefreshTokenEntity requireActive(String token) {
      return requireActiveResult;
    }

    @Override
    public void revoke(String token) {
      revokedToken = token;
    }

    @Override
    public String create(String token, String userId, int refreshTokenDays) {
      createdToken = token;
      createdUserId = userId;
      createdDays = refreshTokenDays;
      return "created-refresh";
    }
  }

  private static final class RecordingOAuthSupport extends OAuthSupport {
    RecordingOAuthSupport() {
      super(null, null);
    }

    @Override
    public String normalizeReturnTo(String returnTo) {
      return returnTo;
    }

    @Override
    public String buildAuthorizationUrl(String state) {
      return "https://accounts.example.test/start?state=" + state;
    }

    @Override
    public String exchangeCodeForEmail(String code) {
      return "oauth@example.test";
    }

    @Override
    public String buildCallbackRedirect(String returnTo, TokenResponse session, String email) {
      return "https://app.example.test/callback?token=" + session.accessToken() + "&email=" + email;
    }
  }

  private static final class RecordingUserService extends UserService {
    private UserEntity userResult;
    private String requestedEmail;

    @Override
    public UserEntity findOrCreateUser(String email) {
      requestedEmail = email;
      return userResult;
    }
  }

  private static final class RecordingAuthService extends AuthService {
    private final CurrentUser verifiedUser;
    private String seenToken;

    RecordingAuthService(CurrentUser verifiedUser) {
      super(TestConfigFactory.defaultAuthConfig(), new AuthCollaborators(null, null, null, null));
      this.verifiedUser = verifiedUser;
    }

    @Override
    public CurrentUser verifyAccessToken(String token) {
      seenToken = token;
      return verifiedUser;
    }
  }
}