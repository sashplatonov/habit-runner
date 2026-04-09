package com.habittracker.auth;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.habittracker.auth.dto.TokenResponse;
import com.habittracker.support.TestConfigFactory;
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
    assertEquals("state-123", client.lastState);
    assertEquals("https://api.example.test/auth/google/callback", client.lastCallbackUrl);
  }

  @Test
  void shouldDelegateCodeExchangeWhenOAuthSupportExchangesCode() {
    var helper = new RecordingOAuthHelper();
    var client = new RecordingGoogleOAuthClient();
    var support = new OAuthSupport(client, helper);

    var email = support.exchangeCodeForEmail("oauth-code");

    assertEquals("oauth@example.test", email);
    assertEquals("oauth-code", client.lastCode);
    assertEquals("https://api.example.test/auth/google/callback", client.lastCallbackUrl);
  }

  @Test
  void shouldDelegateReturnToNormalizationAndCallbackRedirectWhenOAuthSupportUsesHelper() {
    var helper = new RecordingOAuthHelper();
    var support = new OAuthSupport(new RecordingGoogleOAuthClient(), helper);
    var session = new TokenResponse("access", "refresh", 60, "Bearer");

    var normalized = support.normalizeReturnTo("https://client.example.test/path");
    var redirect = support.buildCallbackRedirect("https://client.example.test", session, "user@example.test");
    var callbackUrl = support.getCallbackUrl();

    assertEquals("https://client.example.test", normalized);
    assertEquals("https://client.example.test/auth/callback?ok=true", redirect);
    assertEquals("https://api.example.test/auth/google/callback", callbackUrl);
    assertEquals("https://client.example.test/path", helper.lastReturnTo);
    assertEquals("https://client.example.test", helper.lastRedirectBase);
    assertEquals("user@example.test", helper.lastEmail);
  }

  private static final class RecordingGoogleOAuthClient extends GoogleOAuthClient {
    private String lastState;
    private String lastCallbackUrl;
    private String lastCode;

    private RecordingGoogleOAuthClient() {
      super(TestConfigFactory.defaultAuthConfig(), new ObjectMapper());
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

  private static final class RecordingOAuthHelper extends OAuthHelper {
    private String lastReturnTo;
    private String lastRedirectBase;
    private String lastEmail;

    private RecordingOAuthHelper() {
      super(TestConfigFactory.defaultAuthConfig());
    }

    @Override
    public String normalizeReturnTo(String returnTo) {
      lastReturnTo = returnTo;
      return "https://client.example.test";
    }

    @Override
    public String buildCallbackRedirect(String returnTo, TokenResponse session, String email) {
      lastRedirectBase = returnTo;
      lastEmail = email;
      return returnTo + "/auth/callback?ok=true";
    }

    @Override
    public String getCallbackUrl() {
      return "https://api.example.test/auth/google/callback";
    }
  }
}