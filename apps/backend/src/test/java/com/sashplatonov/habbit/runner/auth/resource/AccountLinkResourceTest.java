package com.sashplatonov.habbit.runner.auth.resource;

import com.sashplatonov.habbit.runner.auth.identity.AccountLinkService;
import com.sashplatonov.habbit.runner.auth.identity.AccountConnectionService;
import com.sashplatonov.habbit.runner.auth.security.CurrentUser;
import com.sashplatonov.habbit.runner.auth.security.CurrentUserContext;
import com.sashplatonov.habbit.runner.auth.telegram.TelegramLinkConfirmRequest;
import com.sashplatonov.habbit.runner.auth.telegram.TelegramLinkRequest;
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
    var userContext = mock(CurrentUserContext.class);
    when(userContext.requireUser()).thenReturn(new CurrentUser("owner", "owner@example.com"));
    when(service.startTelegramLink("owner")).thenReturn("challenge-token");
    when(service.status("owner", "challenge-token")).thenReturn("PENDING");
    when(service.isTelegramLinked("owner")).thenReturn(true);
    var resource = new AccountLinkResource(service, userContext);
    resource.accountConnectionService = connectionService;
    when(connectionService.connections("owner"))
        .thenReturn(new com.sashplatonov.habbit.runner.auth.dto.AccountConnectionsResponse(java.util.List.of()));

    assertEquals(Response.Status.OK.getStatusCode(), resource.startTelegramLink().getStatus());
    assertEquals(Response.Status.NO_CONTENT.getStatusCode(),
        resource.completeTelegramLink(new TelegramLinkRequest("challenge-token", "signed")).getStatus());
    assertEquals(Response.Status.NO_CONTENT.getStatusCode(),
        resource.confirmTelegramLink(new TelegramLinkConfirmRequest("challenge-token")).getStatus());
    assertEquals(Response.Status.OK.getStatusCode(),
        resource.telegramLinkStatus("challenge-token").getStatus());
    assertEquals(Response.Status.OK.getStatusCode(), resource.telegramConnection().getStatus());
    assertEquals(0, resource.connections().connections().size());
    assertEquals(Response.Status.NO_CONTENT.getStatusCode(),
        resource.cancelTelegramLink("challenge-token").getStatus());
    assertEquals(Response.Status.NO_CONTENT.getStatusCode(), resource.detach("telegram").getStatus());
    verify(service).isTelegramLinked("owner");
    verify(connectionService).detach("owner", "telegram");
  }
}
