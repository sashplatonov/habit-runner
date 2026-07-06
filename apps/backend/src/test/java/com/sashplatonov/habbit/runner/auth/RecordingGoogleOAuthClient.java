package com.sashplatonov.habbit.runner.auth;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.sashplatonov.habbit.runner.support.TestConfigFactory;

public final class RecordingGoogleOAuthClient extends GoogleOAuthClient {
  private String lastState;
  private String lastCallbackUrl;
  private String lastCode;

  public RecordingGoogleOAuthClient() {
    super(TestConfigFactory.defaultAuthConfig(), new ObjectMapper());
  }

  public String getLastState() {
    return lastState;
  }

  public String getLastCallbackUrl() {
    return lastCallbackUrl;
  }

  public String getLastCode() {
    return lastCode;
  }

  @Override
  public String buildAuthorizationUrl(String state, String callbackUrl) {
    lastState = state;
    lastCallbackUrl = callbackUrl;
    return "https://accounts.example.test/auth?state=" + state;
  }

  @Override
  public String exchangeCodeForEmail(String code, String callbackUrl) {
    lastCode = code;
    lastCallbackUrl = callbackUrl;
    return "oauth@example.test";
  }
}
