package com.sashplatonov.habbit.runner.auth;

import com.sashplatonov.habbit.runner.auth.support.OAuthSupport;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;

class OAuthSupportTest {

  @Test
  void shouldDelegateAuthorizationUrlWhenOAuthSupportBuildsAuthorizationUrl() {
    var helper = new RecordingOAuthHelper();
    var client = new RecordingGoogleOAuthClient();
    var support = new OAuthSupport(client, helper);

    var authorizationUrl = support.buildAuthorizationUrl("state-123");

    assertEquals("https://accounts.example.test/auth?state=state-123", authorizationUrl);
    assertEquals("state-123", client.getLastState());
    assertEquals("https://api.example.test/auth/google/callback", client.getLastCallbackUrl());
  }

  @Test
  void shouldDelegateCodeExchangeWhenOAuthSupportExchangesCode() {
    var helper = new RecordingOAuthHelper();
    var client = new RecordingGoogleOAuthClient();
    var support = new OAuthSupport(client, helper);

    var email = support.exchangeCodeForEmail("oauth-code");

    assertEquals("oauth@example.test", email);
    assertEquals("oauth-code", client.getLastCode());
    assertEquals("https://api.example.test/auth/google/callback", client.getLastCallbackUrl());
  }

  @Test
  void shouldDelegateReturnToNormalizationAndCallbackRedirectWhenOAuthSupportUsesHelper() {
    var helper = new RecordingOAuthHelper();
    var support = new OAuthSupport(new RecordingGoogleOAuthClient(), helper);

    var normalized = support.normalizeReturnTo("https://client.example.test/path");
    var redirect = support.buildCallbackRedirect("https://client.example.test");
    var callbackUrl = support.getCallbackUrl();

    assertEquals("https://client.example.test", normalized);
    assertEquals("https://client.example.test/auth/callback?ok=true", redirect);
    assertEquals("https://api.example.test/auth/google/callback", callbackUrl);
    assertEquals("https://client.example.test/path", helper.getLastReturnTo());
    assertEquals("https://client.example.test", helper.getLastRedirectBase());
  }
}
