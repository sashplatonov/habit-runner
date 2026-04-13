package com.sashplatonov.habbit.runner.support;

import com.sashplatonov.habbit.runner.auth.OAuthSupport;

public class RecordingOAuthSupport extends OAuthSupport {
  public RecordingOAuthSupport() {
    super(null, null);
  }

  @Override
  public String normalizeReturnTo(String returnTo) {
    return returnTo;
  }

  @Override
  public String buildAuthorizationUrl(String state) {
    return "https://accounts.example.test/start?state=" + state;
  }

  @Override
  public String exchangeCodeForEmail(String code) {
    return "oauth@example.test";
  }

  @Override
  public String buildCallbackRedirect(String returnTo) {
    return "https://app.example.test/callback";
  }
}
