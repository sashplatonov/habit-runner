package com.sashplatonov.habbit.runner.auth;

import com.sashplatonov.habbit.runner.model.OAuthStateEntity;
import com.sashplatonov.habbit.runner.model.UserEntity;
import com.sashplatonov.habbit.runner.repository.OAuthStateRepository;
import com.sashplatonov.habbit.runner.repository.UserRepository;

import java.time.Instant;

abstract class AuthServiceSupport {
  protected final AuthConfig authConfig;
  protected final AuthCollaborators collaborators;
  protected final UserRepository userRepository;
  protected final OAuthStateRepository oauthStateRepository;

  protected AuthServiceSupport() {
    this(null, null, null, null);
  }

  protected AuthServiceSupport(
      AuthConfig authConfig,
      AuthCollaborators collaborators,
      UserRepository userRepository,
      OAuthStateRepository oauthStateRepository
  ) {
    this.authConfig = authConfig;
    this.collaborators = collaborators;
    this.userRepository = userRepository;
    this.oauthStateRepository = oauthStateRepository;
  }

  protected UserEntity findUserByEmail(String email) {
    return userRepository == null ? null : userRepository.findByEmail(email);
  }

  protected UserEntity findUserById(String userId) {
    return userRepository == null ? null : userRepository.findRequiredById(userId);
  }

  protected OAuthStateEntity findOAuthState(String state) {
    return oauthStateRepository == null ? null : oauthStateRepository.findById(state);
  }

  protected void deleteOAuthState(String state) {
    if (oauthStateRepository != null) {
      oauthStateRepository.deleteState(state);
    }
  }

  protected void storeOAuthState(String state, String returnTo, Instant expiresAt) {
    var payload = new OAuthStateEntity();
    payload.state = state;
    payload.returnTo = returnTo;
    payload.setExpiry(expiresAt);
    if (oauthStateRepository != null) {
      oauthStateRepository.save(payload);
    }
  }

  protected Instant now() {
    return Instant.now();
  }

  public int refreshTokenDays() {
    return authConfig.refreshTokenDays();
  }
}
