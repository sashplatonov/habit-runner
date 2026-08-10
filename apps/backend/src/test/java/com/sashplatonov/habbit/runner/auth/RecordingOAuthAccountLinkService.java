package com.sashplatonov.habbit.runner.auth;

import com.sashplatonov.habbit.runner.auth.service.OAuthAccountLinkService;
import com.sashplatonov.habbit.runner.auth.support.AuthCollaborators;
import com.sashplatonov.habbit.runner.model.UserEntity;

final class RecordingOAuthAccountLinkService extends OAuthAccountLinkService {
  private String survivor;
  private String absorbed;

  RecordingOAuthAccountLinkService() {
    super((AuthCollaborators) null);
  }

  @Override
  public UserEntity resolve(UserEntity googleUser, String email, String ownerId) {
    survivor = ownerId;
    absorbed = googleUser.getId();
    var owner = AuthServiceUnitCoverageTest.user(ownerId, email);
    return owner;
  }

  String survivor() { return survivor; }
  String absorbed() { return absorbed; }
}
