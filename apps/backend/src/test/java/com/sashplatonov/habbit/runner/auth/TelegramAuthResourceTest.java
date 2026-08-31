package com.sashplatonov.habbit.runner.auth;

import com.sashplatonov.habbit.runner.auth.dto.TelegramSessionResponse;
import com.sashplatonov.habbit.runner.auth.dto.TokenResponse;
import com.sashplatonov.habbit.runner.auth.resource.TelegramAuthResource;
import com.sashplatonov.habbit.runner.auth.security.CurrentUser;
import com.sashplatonov.habbit.runner.auth.service.TelegramSessionService;
import com.sashplatonov.habbit.runner.auth.support.AuthCookieBuilder;
import com.sashplatonov.habbit.runner.auth.support.AuthRateLimitService;
import com.sashplatonov.habbit.runner.auth.support.AuthResourceSupport;
import com.sashplatonov.habbit.runner.auth.support.AuthenticatedSession;
import com.sashplatonov.habbit.runner.auth.telegram.TelegramInitDataVerifier;
import com.sashplatonov.habbit.runner.auth.telegram.TelegramSessionRequest;
import com.sashplatonov.habbit.runner.auth.telegram.TelegramWebAppUser;
import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class TelegramAuthResourceTest {
  @Test
  void issuesSessionCookiesForVerifiedTelegramUser() {
    var telegramSessionService = mock(TelegramSessionService.class);
    var verifier = mock(TelegramInitDataVerifier.class);
    var cookies = mock(AuthCookieBuilder.class);
    var support = mock(AuthResourceSupport.class);
    when(support.cookieBuilder()).thenReturn(cookies);
    when(support.rateLimitService()).thenReturn(mock(AuthRateLimitService.class));
    when(verifier.verify("signed")).thenReturn(new TelegramWebAppUser(42, "alice", null, null));
    when(telegramSessionService.authenticate(any())).thenReturn(
        new AuthenticatedSession(
            new TokenResponse("access", "refresh", 3600, "Bearer", true),
            new CurrentUser("user-1", null)));
    var response = new TelegramAuthResource(telegramSessionService, verifier, support)
        .session(new TelegramSessionRequest("signed"));
    assertEquals(200, response.getStatus());
    assertEquals(new TelegramSessionResponse("user-1", null, true), response.getEntity());
  }
}
