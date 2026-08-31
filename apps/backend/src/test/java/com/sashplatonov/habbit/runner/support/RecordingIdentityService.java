package com.sashplatonov.habbit.runner.support;

import com.sashplatonov.habbit.runner.auth.identity.IdentityService;
import com.sashplatonov.habbit.runner.auth.identity.TelegramIdentityResolution;
import com.sashplatonov.habbit.runner.repository.AuthIdentityRepository;
import com.sashplatonov.habbit.runner.repository.UserRepository;

public class RecordingIdentityService extends IdentityService {
  public RecordingIdentityService(AuthIdentityRepository identityRepository, UserRepository userRepository) {
    super(identityRepository, userRepository);
  }

  @Override
  public TelegramIdentityResolution resolveTelegram(String providerSubject, String displayName) {
    return new TelegramIdentityResolution("telegram-user", false);
  }
}
