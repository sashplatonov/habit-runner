package com.sashplatonov.habbit.runner.auth.service;

import com.sashplatonov.habbit.runner.auth.access.OAuthStateAccess;
import com.sashplatonov.habbit.runner.auth.support.OAuthSupport;

import java.time.Instant;

final class FixedClockOAuthExchangeService extends OAuthExchangeService {
  private static final Instant FIXED_NOW = Instant.parse("2026-04-10T13:00:00Z");

  FixedClockOAuthExchangeService(
      OAuthSupport oauthSupport,
      OAuthStateAccess oauthStateAccess,
      OAuthAccountLinkService oauthAccountLinkService,
      TokenIssuer tokenIssuer
  ) {
    super(oauthSupport, oauthStateAccess, oauthAccountLinkService, tokenIssuer);
  }

  @Override
  protected Instant now() {
    return FIXED_NOW;
  }
}
