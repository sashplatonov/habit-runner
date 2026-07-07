package com.sashplatonov.habbit.runner.auth.support;

import com.sashplatonov.habbit.runner.auth.config.AuthConfig;
import jakarta.enterprise.context.ApplicationScoped;

@ApplicationScoped
public class OAuthHelper {
  private final AuthConfig authConfig;

  public OAuthHelper(AuthConfig authConfig) {
    this.authConfig = authConfig;
  }

  public String buildCallbackRedirect(String returnTo) {
    return returnTo + "/auth/callback";
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
