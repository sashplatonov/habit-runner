package com.sashplatonov.habbit.runner.auth;

import com.sashplatonov.habbit.runner.auth.identity.IdentityService;
import com.sashplatonov.habbit.runner.auth.identity.TelegramIdentityResolution;

final class TestIdentityService extends IdentityService {
  private TelegramIdentityResolution resolution = new TelegramIdentityResolution("telegram-user", false);

  void setResolution(TelegramIdentityResolution resolution) {
    this.resolution = resolution;
  }

  @Override
  public TelegramIdentityResolution resolveTelegram(String providerSubject, String displayName) {
    return resolution;
  }
}
