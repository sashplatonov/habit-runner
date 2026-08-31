package com.sashplatonov.habbit.runner.auth.service;

import com.sashplatonov.habbit.runner.auth.access.OAuthStateAccess;
import com.sashplatonov.habbit.runner.auth.support.OAuthSupport;

import java.time.Instant;

final class FixedClockOAuthAuthorizationService extends OAuthAuthorizationService {
  private static final Instant FIXED_NOW = Instant.parse("2026-04-10T13:00:00Z");

  FixedClockOAuthAuthorizationService(OAuthSupport oauthSupport, OAuthStateAccess oauthStateAccess) {
    super(oauthSupport, oauthStateAccess);
  }

  @Override
  protected Instant now() {
    return FIXED_NOW;
  }
}
