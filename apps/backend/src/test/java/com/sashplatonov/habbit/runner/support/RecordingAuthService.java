package com.sashplatonov.habbit.runner.support;

import com.sashplatonov.habbit.runner.auth.support.AuthCollaborators;
import com.sashplatonov.habbit.runner.auth.service.AuthService;
import com.sashplatonov.habbit.runner.auth.security.CurrentUser;

public class RecordingAuthService extends AuthService {
  public final CurrentUser verifiedUser;
  public String seenToken;

  public RecordingAuthService(CurrentUser verifiedUser) {
    super(TestConfigFactory.defaultAuthConfig(), new AuthCollaborators(null, null, null, null));
    this.verifiedUser = verifiedUser;
  }

  @Override
  public CurrentUser verifyAccessToken(String token) {
    seenToken = token;
    return verifiedUser;
  }
}
