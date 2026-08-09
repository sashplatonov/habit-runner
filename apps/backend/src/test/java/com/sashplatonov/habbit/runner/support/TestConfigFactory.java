package com.sashplatonov.habbit.runner.support;

import com.sashplatonov.habbit.runner.auth.config.AuthConfig;
import com.sashplatonov.habbit.runner.notification.NotificationConfig;

import java.util.Optional;

public final class TestConfigFactory {
  private static final String DEFAULT_SECRET = "test-secret-for-unit-tests-1234567890";
  private static final String DEFAULT_ISSUER = "habittracker-test";
  private static final String DEFAULT_API_PUBLIC_URL = "https://api.example.test";
  private static final String DEFAULT_RETURN_TO = "https://app.example.test";
  private static final String DEFAULT_CLIENT_ID = "google-client-id";
  private static final String DEFAULT_CLIENT_SECRET = "google-client-secret";

  private TestConfigFactory() {
  }

  public static AuthConfig defaultAuthConfig() {
    return authConfig(new AuthConfigOptions(
        DEFAULT_SECRET,
        DEFAULT_ISSUER,
        DEFAULT_API_PUBLIC_URL,
        DEFAULT_RETURN_TO,
        DEFAULT_CLIENT_ID,
        DEFAULT_CLIENT_SECRET
    ));
  }

  public static AuthConfig authConfig(String secret, String issuer) {
    return authConfig(new AuthConfigOptions(
        secret,
        issuer,
        DEFAULT_API_PUBLIC_URL,
        DEFAULT_RETURN_TO,
        DEFAULT_CLIENT_ID,
        DEFAULT_CLIENT_SECRET
    ));
  }

  public static AuthConfig authConfig(
      String secret,
      String issuer,
      String apiPublicUrl,
      String oauthDefaultReturnTo
  ) {
    return authConfig(new AuthConfigOptions(
        secret,
        issuer,
        apiPublicUrl,
        oauthDefaultReturnTo,
        DEFAULT_CLIENT_ID,
        DEFAULT_CLIENT_SECRET
    ));
  }

  public static AuthConfig telegramAuthConfig(String botToken) {
    var base = defaultAuthConfig();
    return new AuthConfig() {
      public String secret() { return base.secret(); }
      public int accessTokenTtlSeconds() { return base.accessTokenTtlSeconds(); }
      public int refreshTokenDays() { return base.refreshTokenDays(); }
      public String apiPublicUrl() { return base.apiPublicUrl(); }
      public String oauthDefaultReturnTo() { return base.oauthDefaultReturnTo(); }
      public Optional<String> googleClientId() { return base.googleClientId(); }
      public Optional<String> googleClientSecret() { return base.googleClientSecret(); }
      public String issuer() { return base.issuer(); }
      public Optional<String> telegramBotToken() { return Optional.of(botToken); }
      public long telegramInitDataMaxAgeSeconds() { return 86400L; }
    };
  }

  private static AuthConfig authConfig(AuthConfigOptions options) {
    return new AuthConfig() {
      @Override
      public String secret() {
        return options.secret();
      }

      @Override
      public int accessTokenTtlSeconds() {
        return 3600;
      }

      @Override
      public int refreshTokenDays() {
        return 30;
      }

      @Override
      public String apiPublicUrl() {
        return options.apiPublicUrl();
      }

      @Override
      public String oauthDefaultReturnTo() {
        return options.oauthDefaultReturnTo();
      }

      @Override
      public Optional<String> googleClientId() {
        return Optional.ofNullable(options.googleClientId());
      }

      @Override
      public Optional<String> googleClientSecret() {
        return Optional.ofNullable(options.googleClientSecret());
      }

      @Override
      public String issuer() {
        return options.issuer();
      }

      public Optional<String> telegramBotToken() {
        return Optional.empty();
      }

      public long telegramInitDataMaxAgeSeconds() {
        return 86400L;
      }
    };
  }

  public static NotificationConfig notificationConfig(String vapidPublicKey) {
    return () -> Optional.ofNullable(vapidPublicKey);
  }
}
