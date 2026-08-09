package com.sashplatonov.habbit.runner.auth.resource;

import com.sashplatonov.habbit.runner.auth.identity.AccountLinkService;
import com.sashplatonov.habbit.runner.auth.security.CurrentUser;
import com.sashplatonov.habbit.runner.auth.security.CurrentUserContext;
import com.sashplatonov.habbit.runner.auth.telegram.TelegramLinkConfirmRequest;
import com.sashplatonov.habbit.runner.auth.telegram.TelegramLinkRequest;
import jakarta.ws.rs.core.Response;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class AccountLinkResourceTest {
  @Test
  void delegatesAllTelegramLinkOperationsToTheAuthenticatedOwner() {
    var service = mock(AccountLinkService.class);
    var userContext = mock(CurrentUserContext.class);
    when(userContext.requireUser()).thenReturn(new CurrentUser("owner", "owner@example.com"));
    when(service.startTelegramLink("owner")).thenReturn("challenge-token");
    when(service.status("owner", "challenge-token")).thenReturn("PENDING");
    var resource = new AccountLinkResource(service, userContext);

    assertEquals(Response.Status.OK.getStatusCode(), resource.startTelegramLink().getStatus());
    assertEquals(Response.Status.NO_CONTENT.getStatusCode(),
        resource.completeTelegramLink(new TelegramLinkRequest("challenge-token", "signed")).getStatus());
    assertEquals(Response.Status.NO_CONTENT.getStatusCode(),
        resource.confirmTelegramLink(new TelegramLinkConfirmRequest("challenge-token")).getStatus());
    assertEquals(Response.Status.OK.getStatusCode(),
        resource.telegramLinkStatus("challenge-token").getStatus());
    assertEquals(Response.Status.NO_CONTENT.getStatusCode(),
        resource.cancelTelegramLink("challenge-token").getStatus());
  }
}
