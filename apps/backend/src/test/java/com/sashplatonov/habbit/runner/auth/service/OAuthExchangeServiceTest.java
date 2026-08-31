package com.sashplatonov.habbit.runner.auth.service;

import com.sashplatonov.habbit.runner.auth.support.AuthRateLimitService;
import com.sashplatonov.habbit.runner.auth.support.OAuthSupport;
import com.sashplatonov.habbit.runner.model.OAuthStateEntity;
import com.sashplatonov.habbit.runner.model.UserEntity;
import com.sashplatonov.habbit.runner.support.RecordingJwtUtil;
import com.sashplatonov.habbit.runner.support.RecordingRefreshTokenService;
import com.sashplatonov.habbit.runner.support.TestConfigFactory;
import jakarta.ws.rs.BadRequestException;
import jakarta.ws.rs.NotAuthorizedException;
import org.junit.jupiter.api.Test;

import java.time.Instant;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class OAuthExchangeServiceTest {

  @Test
  void shouldRejectOAuthCallbackWhenParametersAreMissing() {
    var service = service(mock(OAuthSupport.class), new StubOAuthStateAccess(null), new StubUserService());

    assertThrows(BadRequestException.class, () -> service.exchange(" ", "state-token"));
    assertThrows(BadRequestException.class, () -> service.exchange("code-123", " "));
  }

  @Test
  void shouldRejectOAuthCallbackWhenStateIsMissingOrExpired() {
    var service = service(mock(OAuthSupport.class), new StubOAuthStateAccess(null), new StubUserService());

    assertThrows(NotAuthorizedException.class, () -> service.exchange("code-123", "state-token"));

    var expiredState = validState();
    expiredState.setExpiry(Instant.parse("2026-04-10T12:59:59Z"));
    var stateAccess = new StubOAuthStateAccess(expiredState);
    var expiredService = service(mock(OAuthSupport.class), stateAccess, new StubUserService());

    assertThrows(NotAuthorizedException.class, () -> expiredService.exchange("code-123", "state-token"));
    assertEquals("state-token", stateAccess.consumedToken());
  }

  @Test
  void shouldBuildSessionWhenOAuthCallbackStateIsValid() {
    var oauthSupport = mock(OAuthSupport.class);
    when(oauthSupport.exchangeCodeForEmail("code-123")).thenReturn("oauth@example.test");
    when(oauthSupport.buildCallbackRedirect("/dashboard")).thenReturn("https://app.example.test/callback?ok=1");
    var userService = new StubUserService();
    var user = user("oauth-user", "oauth@example.test");
    userService.setUserById(user);
    userService.setOauthUser(user);
    var stateAccess = new StubOAuthStateAccess(validState());
    var service = service(oauthSupport, stateAccess, userService);

    var callback = service.exchange("code-123", "state-token");

    assertEquals("https://app.example.test/callback?ok=1", callback.redirectUrl());
    assertEquals("access::oauth-user::oauth@example.test::3600", callback.session().accessToken());
    assertEquals("state-token", stateAccess.consumedToken());
  }

  @Test
  void shouldMergeGoogleAccountIntoTelegramOwnerWhenLinkIntentIsPresent() {
    var oauthSupport = mock(OAuthSupport.class);
    when(oauthSupport.exchangeCodeForEmail("code-123")).thenReturn("oauth@example.test");
    var userService = new StubUserService();
    var telegramOwner = user("telegram-user", null);
    var googleUser = user("google-user", "oauth@example.test");
    userService.setUserById(telegramOwner);
    userService.setOauthUser(googleUser);
    var merge = new RecordingAccountMergeService();
    var linkService = new OAuthAccountLinkService(userService, merge, new AuthRateLimitService());
    var state = validState();
    state.setLinkUserId("telegram-user");
    var stateAccess = new StubOAuthStateAccess(state);
    var service = service(oauthSupport, stateAccess, linkService, userService);

    service.exchange("code-123", "state-token");

    assertEquals("telegram-user", merge.survivor());
    assertEquals("google-user", merge.absorbed());
    assertEquals("oauth@example.test", telegramOwner.getEmail());
  }

  private UserEntity user(String id, String email) {
    var user = new UserEntity();
    user.setId(id);
    user.setEmail(email);
    return user;
  }

  private OAuthStateEntity validState() {
    var state = new OAuthStateEntity();
    state.state = "state-token";
    state.returnTo = "/dashboard";
    state.setExpiry(Instant.parse("2026-04-10T13:10:00Z"));
    return state;
  }

  private OAuthExchangeService service(
      OAuthSupport oauthSupport,
      StubOAuthStateAccess stateAccess,
      StubUserService userService
  ) {
    var linkService = new OAuthAccountLinkService(userService, new RecordingAccountMergeService(),
        new AuthRateLimitService());
    return service(oauthSupport, stateAccess, linkService, userService);
  }

  private OAuthExchangeService service(
      OAuthSupport oauthSupport,
      StubOAuthStateAccess stateAccess,
      OAuthAccountLinkService linkService,
      StubUserService userService
  ) {
    return new FixedClockOAuthExchangeService(oauthSupport, stateAccess, linkService,
        new TokenIssuer(
            new RecordingJwtUtil(),
            new RecordingRefreshTokenService(),
            TestConfigFactory.defaultAuthConfig(),
            userService
        ));
  }
}
