package com.sashplatonov.habbit.runner.auth;

import com.sashplatonov.habbit.runner.model.OAuthStateEntity;

public interface OAuthStateAccess {
  OAuthStateEntity consume(String state);
  void save(OAuthStateEntity payload);
}
