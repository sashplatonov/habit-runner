package com.sashplatonov.habbit.runner.auth;

import com.sashplatonov.habbit.runner.auth.support.OAuthHelper;
import com.sashplatonov.habbit.runner.support.TestConfigFactory;

public final class RecordingOAuthHelper extends OAuthHelper {
  private String lastReturnTo;
  private String lastRedirectBase;

  public RecordingOAuthHelper() {
    super(TestConfigFactory.defaultAuthConfig());
  }

  public String getLastReturnTo() {
    return lastReturnTo;
  }

  public String getLastRedirectBase() {
    return lastRedirectBase;
  }

  @Override
  public String normalizeReturnTo(String returnTo) {
    lastReturnTo = returnTo;
    return "https://client.example.test";
  }

  @Override
  public String buildCallbackRedirect(String returnTo) {
    lastRedirectBase = returnTo;
    return returnTo + "/auth/callback?ok=true";
  }

  @Override
  public String getCallbackUrl() {
    return "https://api.example.test/auth/google/callback";
  }
}
