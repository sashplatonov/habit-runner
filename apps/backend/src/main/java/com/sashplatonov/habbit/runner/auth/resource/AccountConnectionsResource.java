package com.sashplatonov.habbit.runner.auth.resource;

import com.sashplatonov.habbit.runner.auth.identity.AccountConnectionService;
import com.sashplatonov.habbit.runner.auth.security.CurrentUserContext;
import com.sashplatonov.habbit.runner.auth.security.RequireAuth;
import com.sashplatonov.habbit.runner.auth.dto.AccountConnectionsResponse;
import jakarta.inject.Inject;
import jakarta.ws.rs.DELETE;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.PathParam;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;

@Path("/auth/link")
@Produces(MediaType.APPLICATION_JSON)
public class AccountConnectionsResource {
  final AccountConnectionService accountConnectionService;
  final CurrentUserContext currentUserContext;

  @Inject
  AccountConnectionsResource(
      AccountConnectionService accountConnectionService,
      CurrentUserContext currentUserContext
  ) {
    this.accountConnectionService = accountConnectionService;
    this.currentUserContext = currentUserContext;
  }

  @RequireAuth
  @GET
  @Path("/connections")
  public AccountConnectionsResponse connections() {
    return accountConnectionService.connections(currentUserContext.requireUser().id());
  }

  @RequireAuth
  @DELETE
  @Path("/connections/{provider}")
  public Response detach(@PathParam("provider") String provider) {
    accountConnectionService.detach(currentUserContext.requireUser().id(), provider);
    return Response.noContent().build();
  }
}
