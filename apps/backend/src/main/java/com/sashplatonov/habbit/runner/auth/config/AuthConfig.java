package com.sashplatonov.habbit.runner.auth.config;

import io.smallrye.config.ConfigMapping;

import java.util.Optional;

@ConfigMapping(prefix = "auth")
public interface AuthConfig {
  String secret();

  int accessTokenTtlSeconds();

  int refreshTokenDays();

  String apiPublicUrl();

  String oauthDefaultReturnTo();

  Optional<String> googleClientId();

  Optional<String> googleClientSecret();

  String issuer();

  Optional<String> telegramBotToken();

  long telegramInitDataMaxAgeSeconds();
}
