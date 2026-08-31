package com.sashplatonov.habbit.runner.auth.resource;

import com.sashplatonov.habbit.runner.auth.identity.AccountLinkService;
import com.sashplatonov.habbit.runner.auth.identity.AccountConnectionService;
import com.sashplatonov.habbit.runner.auth.security.CurrentUser;
import com.sashplatonov.habbit.runner.auth.security.CurrentUserContext;
import com.sashplatonov.habbit.runner.auth.telegram.TelegramLinkRequest;
import com.sashplatonov.habbit.runner.auth.service.TelegramLinkCompletionService;
import com.sashplatonov.habbit.runner.auth.support.AuthCookieBuilder;
import com.sashplatonov.habbit.runner.auth.support.AuthenticatedSession;
import com.sashplatonov.habbit.runner.auth.dto.AccountConnectionsResponse;
import com.sashplatonov.habbit.runner.auth.dto.AuthSessionResponse;
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
    var completionService = mock(TelegramLinkCompletionService.class);
    var cookieBuilder = mock(AuthCookieBuilder.class);
    var userContext = mock(CurrentUserContext.class);
    when(userContext.requireUser()).thenReturn(new CurrentUser("owner", "owner@example.com"));
    when(service.startTelegramLink("owner")).thenReturn("challenge-token");
    when(completionService.complete("challenge-token", "signed")).thenReturn(
        new AuthenticatedSession(
            new TokenResponse("access", "refresh", 3600, "Bearer"),
            new CurrentUser("owner", "owner@example.com")));
    when(service.isTelegramLinked("owner")).thenReturn(true);
    when(connectionService.connections("owner"))
        .thenReturn(new AccountConnectionsResponse(java.util.List.of()));
    var linkResource = new TelegramLinkResource(service, userContext, completionService, cookieBuilder);
    var connectionsResource = new AccountConnectionsResource(connectionService, userContext);

    assertEquals(Response.Status.OK.getStatusCode(), linkResource.startTelegramLink().getStatus());
    var completion = linkResource.completeTelegramLink(new TelegramLinkRequest("challenge-token", "signed"), "csrf");
    assertEquals(Response.Status.OK.getStatusCode(), completion.getStatus());
    assertEquals(new AuthSessionResponse("owner", "owner@example.com"), completion.getEntity());
    assertEquals(Response.Status.OK.getStatusCode(), linkResource.telegramConnection().getStatus());
    assertEquals(0, connectionsResource.connections().connections().size());
    assertEquals(Response.Status.NO_CONTENT.getStatusCode(), connectionsResource.detach("telegram").getStatus());
    verify(service).isTelegramLinked("owner");
    verify(connectionService).detach("owner", "telegram");
  }
}
