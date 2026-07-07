package com.sashplatonov.habbit.runner.auth;

import com.sashplatonov.habbit.runner.model.OAuthStateEntity;
import com.sashplatonov.habbit.runner.repository.OAuthStateRepository;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;

@ApplicationScoped
class RepositoryOAuthStateAccess implements OAuthStateAccess {
  private final OAuthStateRepository oauthStateRepository;

  @Inject
  RepositoryOAuthStateAccess(OAuthStateRepository oauthStateRepository) {
    this.oauthStateRepository = oauthStateRepository;
  }

  @Override
  public OAuthStateEntity consume(String state) {
    var stateEntity = oauthStateRepository.findById(state);
    oauthStateRepository.deleteState(state);
    return stateEntity;
  }

  @Override
  public void save(OAuthStateEntity payload) {
    oauthStateRepository.save(payload);
  }
}
