package com.sashplatonov.habbit.runner.auth;

import jakarta.enterprise.context.RequestScoped;

@RequestScoped
public class CurrentUserContext {
  private CurrentUser user;

  public void setUser(CurrentUser user) {
    this.user = user;
  }

  public CurrentUser requireUser() {
    if (user == null) {
      throw new jakarta.ws.rs.NotAuthorizedException("Authentication required");
    }
    return user;
  }
}
