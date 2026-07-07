package com.sashplatonov.habbit.runner.auth.support;

import com.sashplatonov.habbit.runner.auth.client.GoogleOAuthClient;
import jakarta.enterprise.context.ApplicationScoped;

@ApplicationScoped
public class OAuthSupport {
  private final GoogleOAuthClient googleOAuthClient;
  private final OAuthHelper oauthHelper;

  public OAuthSupport(GoogleOAuthClient googleOAuthClient, OAuthHelper oauthHelper) {
    this.googleOAuthClient = googleOAuthClient;
    this.oauthHelper = oauthHelper;
  }

  public String normalizeReturnTo(String returnTo) {
    return oauthHelper.normalizeReturnTo(returnTo);
  }

  public String getCallbackUrl() {
    return oauthHelper.getCallbackUrl();
  }

  public String buildAuthorizationUrl(String state) {
    return googleOAuthClient.buildAuthorizationUrl(state, oauthHelper.getCallbackUrl());
  }

  public String exchangeCodeForEmail(String code) {
    return googleOAuthClient.exchangeCodeForEmail(code, oauthHelper.getCallbackUrl());
  }

  public String buildCallbackRedirect(String returnTo) {
    return oauthHelper.buildCallbackRedirect(returnTo);
  }
}
