package com.sashplatonov.habbit.runner.auth;

import com.sashplatonov.habbit.runner.auth.support.OAuthSupport;

final class TestOAuthSupport extends OAuthSupport {
  private String normalizedReturnTo = "/";
  private String oauthEmail = "oauth@example.test";
  private String callbackRedirect = "https://app.example.test/callback";
  private String exchangedCode;

  TestOAuthSupport() {
    super(null, null);
  }

  void setNormalizedReturnTo(String normalizedReturnTo) {
    this.normalizedReturnTo = normalizedReturnTo;
  }

  void setOauthEmail(String oauthEmail) {
    this.oauthEmail = oauthEmail;
  }

  void setCallbackRedirect(String callbackRedirect) {
    this.callbackRedirect = callbackRedirect;
  }

  String getExchangedCode() {
    return exchangedCode;
  }

  @Override
  public String normalizeReturnTo(String returnTo) {
    return normalizedReturnTo;
  }

  @Override
  public String buildAuthorizationUrl(String state) {
    return "https://accounts.example.test/start?state=" + state;
  }

  @Override
  public String exchangeCodeForEmail(String code) {
    exchangedCode = code;
    return oauthEmail;
  }

  @Override
  public String buildCallbackRedirect(String returnTo) {
    return callbackRedirect;
  }
}
