package com.sashplatonov.habbit.runner.auth;

import com.sashplatonov.habbit.runner.auth.identity.IdentityService;
import com.sashplatonov.habbit.runner.auth.identity.TelegramIdentityResolution;
import com.sashplatonov.habbit.runner.repository.AuthIdentityRepository;
import com.sashplatonov.habbit.runner.repository.UserRepository;

final class TestIdentityService extends IdentityService {
  private TelegramIdentityResolution resolution = new TelegramIdentityResolution("telegram-user", false);

  TestIdentityService(AuthIdentityRepository identityRepository, UserRepository userRepository) {
    super(identityRepository, userRepository);
  }

  void setResolution(TelegramIdentityResolution resolution) {
    this.resolution = resolution;
  }

  @Override
  public TelegramIdentityResolution resolveTelegram(String providerSubject, String displayName) {
    return resolution;
  }
}
