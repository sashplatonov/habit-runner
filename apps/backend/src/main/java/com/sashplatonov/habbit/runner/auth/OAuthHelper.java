package com.sashplatonov.habbit.runner.auth;

import com.sashplatonov.habbit.runner.auth.dto.TokenResponse;
import jakarta.enterprise.context.ApplicationScoped;

@ApplicationScoped
public class OAuthHelper {
  private final AuthConfig authConfig;

  public OAuthHelper(AuthConfig authConfig) {
    this.authConfig = authConfig;
  }

  public String buildCallbackRedirect(String returnTo, TokenResponse session, String email) {
    return returnTo + "/auth/callback"
        + "?accessToken=" + AuthSupport.urlEncode(session.accessToken())
        + "&refreshToken=" + AuthSupport.urlEncode(session.refreshToken())
        + "&expiresIn=" + session.expiresIn()
        + "&email=" + AuthSupport.urlEncode(email);
  }

  public String normalizeReturnTo(String returnTo) {
    if (returnTo == null || returnTo.isBlank()) {
      return authConfig.oauthDefaultReturnTo();
    }
    try {
      var parsed = java.net.URI.create(returnTo);
      var scheme = parsed.getScheme();
      if (!"http".equalsIgnoreCase(scheme) && !"https".equalsIgnoreCase(scheme)) {
        return authConfig.oauthDefaultReturnTo();
      }
      return scheme + "://" + parsed.getAuthority();
    } catch (IllegalArgumentException ex) {
      return authConfig.oauthDefaultReturnTo();
    }
  }

  public String getCallbackUrl() {
    return authConfig.apiPublicUrl() + "/auth/google/callback";
  }
}
