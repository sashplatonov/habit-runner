package com.sashplatonov.habbit.runner.auth.service;

import com.sashplatonov.habbit.runner.auth.identity.AccountMergeService;
import com.sashplatonov.habbit.runner.auth.support.AuthCollaborators;
import com.sashplatonov.habbit.runner.model.UserEntity;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.ws.rs.NotAuthorizedException;

@ApplicationScoped
public class OAuthAccountLinkService {
  private final AuthCollaborators collaborators;

  @Inject
  AccountMergeService accountMergeService;

  public OAuthAccountLinkService() {
    this(null);
  }

  @Inject
  public OAuthAccountLinkService(AuthCollaborators collaborators) {
    this.collaborators = collaborators;
  }

  public UserEntity resolve(UserEntity googleUser, String email, String ownerId) {
    if (ownerId == null) {
      return googleUser;
    }
    var owner = collaborators.findRequiredUserById(ownerId);
    if (owner == null) {
      throw new NotAuthorizedException("Linking account no longer exists");
    }
    if (!owner.getId().equals(googleUser.getId())) {
      if (accountMergeService == null) {
        throw new IllegalStateException("Account merge service is not configured");
      }
      accountMergeService.merge(owner.getId(), googleUser.getId());
    }
    owner.setEmail(email);
    return owner;
  }
}
