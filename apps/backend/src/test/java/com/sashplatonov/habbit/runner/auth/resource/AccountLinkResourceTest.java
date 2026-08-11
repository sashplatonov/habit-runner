package com.sashplatonov.habbit.runner.auth.resource;

import com.sashplatonov.habbit.runner.auth.identity.AccountLinkService;
import com.sashplatonov.habbit.runner.auth.identity.AccountConnectionService;
import com.sashplatonov.habbit.runner.auth.security.CurrentUser;
import com.sashplatonov.habbit.runner.auth.security.CurrentUserContext;
import com.sashplatonov.habbit.runner.auth.telegram.TelegramLinkRequest;
import com.sashplatonov.habbit.runner.auth.service.AuthService;
import com.sashplatonov.habbit.runner.auth.support.AuthCookieBuilder;
import com.sashplatonov.habbit.runner.auth.dto.TokenResponse;
import jakarta.ws.rs.core.Response;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class AccountLinkResourceTest {
  @Test
  void delegatesAllTelegramLinkOperationsToTheAuthenticatedOwner() {
    var service = mock(AccountLinkService.class);
    var connectionService = mock(AccountConnectionService.class);
    var authService = mock(AuthService.class);
    var cookieBuilder = mock(AuthCookieBuilder.class);
    var userContext = mock(CurrentUserContext.class);
    when(userContext.requireUser()).thenReturn(new CurrentUser("owner", "owner@example.com"));
    when(service.startTelegramLink("owner")).thenReturn("challenge-token");
    when(service.completeTelegramLink("challenge-token", "signed")).thenReturn("owner");
    when(authService.issueSessionForUserId("owner"))
        .thenReturn(new TokenResponse("access", "refresh", 3600, "Bearer"));
    when(authService.refreshTokenDays()).thenReturn(30);
    when(service.isTelegramLinked("owner")).thenReturn(true);
    var resource = new AccountLinkResource(service, userContext);
    resource.accountConnectionService = connectionService;
    resource.authService = authService;
    resource.authCookieBuilder = cookieBuilder;
    when(connectionService.connections("owner"))
        .thenReturn(new com.sashplatonov.habbit.runner.auth.dto.AccountConnectionsResponse(java.util.List.of()));

    assertEquals(Response.Status.OK.getStatusCode(), resource.startTelegramLink().getStatus());
    assertEquals(Response.Status.OK.getStatusCode(),
        resource.completeTelegramLink(new TelegramLinkRequest("challenge-token", "signed"), "csrf").getStatus());
    assertEquals(Response.Status.OK.getStatusCode(), resource.telegramConnection().getStatus());
    assertEquals(0, resource.connections().connections().size());
    assertEquals(Response.Status.NO_CONTENT.getStatusCode(), resource.detach("telegram").getStatus());
    verify(service).isTelegramLinked("owner");
    verify(connectionService).detach("owner", "telegram");
  }
}
