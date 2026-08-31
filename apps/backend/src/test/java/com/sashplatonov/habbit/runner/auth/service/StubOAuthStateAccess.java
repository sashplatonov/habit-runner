package com.sashplatonov.habbit.runner.auth.service;

import com.sashplatonov.habbit.runner.auth.access.OAuthStateAccess;
import com.sashplatonov.habbit.runner.model.OAuthStateEntity;

final class StubOAuthStateAccess implements OAuthStateAccess {
  private final OAuthStateEntity state;
  private OAuthStateEntity saved;
  private String consumedToken;

  StubOAuthStateAccess(OAuthStateEntity state) {
    this.state = state;
  }

  String consumedToken() {
    return consumedToken;
  }

  OAuthStateEntity savedState() {
    return saved;
  }

  @Override
  public OAuthStateEntity consume(String state) {
    consumedToken = state;
    return this.state;
  }

  @Override
  public void save(OAuthStateEntity payload) {
    saved = payload;
  }
}
