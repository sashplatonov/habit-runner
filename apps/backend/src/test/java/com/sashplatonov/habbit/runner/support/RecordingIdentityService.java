package com.sashplatonov.habbit.runner.support;

import com.sashplatonov.habbit.runner.auth.identity.IdentityService;
import com.sashplatonov.habbit.runner.auth.identity.TelegramIdentityResolution;

public class RecordingIdentityService extends IdentityService {
  @Override
  public TelegramIdentityResolution resolveTelegram(String providerSubject, String displayName) {
    return new TelegramIdentityResolution("telegram-user", false);
  }
}
