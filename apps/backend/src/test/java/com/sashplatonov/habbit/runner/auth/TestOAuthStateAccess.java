package com.sashplatonov.habbit.runner.auth;

import com.sashplatonov.habbit.runner.auth.access.OAuthStateAccess;
import com.sashplatonov.habbit.runner.model.OAuthStateEntity;

final class TestOAuthStateAccess implements OAuthStateAccess {
  private OAuthStateEntity oauthState;
  private StoredState storedState;
  private String deletedState;

  void setOauthState(OAuthStateEntity oauthState) {
    this.oauthState = oauthState;
  }

  StoredState getStoredState() {
    return storedState;
  }

  String getDeletedState() {
    return deletedState;
  }

  @Override
  public OAuthStateEntity consume(String state) {
    deletedState = state;
    return oauthState;
  }

  @Override
  public void save(OAuthStateEntity payload) {
    storedState = new StoredState(payload.state, payload.returnTo, payload.expiry());
  }
}
