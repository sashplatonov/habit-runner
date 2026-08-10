package com.sashplatonov.habbit.runner.health;

import com.sashplatonov.habbit.runner.auth.config.AuthConfig;
import io.quarkus.runtime.StartupEvent;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.enterprise.event.Observes;
import jakarta.inject.Inject;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.HexFormat;
import org.eclipse.microprofile.config.inject.ConfigProperty;

import java.net.InetAddress;
import java.net.URI;
import java.net.UnknownHostException;
import java.util.Locale;
import java.util.Optional;
import lombok.extern.slf4j.Slf4j;

@ApplicationScoped
@Slf4j
class AuthConfigurationValidator {
  private static final int TOKEN_REFERENCE_LENGTH = 12;
  private final AuthConfig authConfig;
  private final String deploymentEnv;

  @Inject
  AuthConfigurationValidator(
      AuthConfig authConfig,
      @ConfigProperty(name = "DEPLOYMENT_ENV", defaultValue = "development") String deploymentEnv
  ) {
    this.authConfig = authConfig;
    this.deploymentEnv = deploymentEnv;
  }

  Optional<String> validate() {
    var basicError = validateBasicConfiguration();
    if (basicError.isPresent() || !isProduction()) {
      return basicError;
    }
    return validateProductionConfiguration();
  }

  private Optional<String> validateBasicConfiguration() {
    java.util.List<java.util.function.Supplier<String>> checks = java.util.List.of(
        () -> isBlank(authConfig.secret()) ? "auth.secret is missing" : null,
        () -> authConfig.accessTokenTtlSeconds() < 1 ? "auth.access-token-ttl-seconds must be positive" : null,
        () -> authConfig.refreshTokenDays() < 1 ? "auth.refresh-token-days must be positive" : null,
        () -> isBlank(authConfig.apiPublicUrl()) ? "auth.api-public-url is missing" : null,
        () -> isBlank(authConfig.oauthDefaultReturnTo()) ? "auth.oauth-default-return-to is missing" : null,
        () -> isBlank(authConfig.issuer()) ? "auth.issuer is missing" : null,
        () -> authConfig.telegramInitDataMaxAgeSeconds() < 1
            ? "auth.telegram-init-data-max-age-seconds must be positive" : null
    );
    return checks.stream().map(java.util.function.Supplier::get)
        .filter(java.util.Objects::nonNull).findFirst();
  }

  private Optional<String> validateProductionConfiguration() {
    if (isWeakProductionSecret(authConfig.secret())) {
      return Optional.of("auth.secret is too weak for production");
    }
    if (isBlank(authConfig.googleClientId().orElse(null))) {
      return Optional.of("auth.google-client-id is missing");
    }
    if (isBlank(authConfig.googleClientSecret().orElse(null))) {
      return Optional.of("auth.google-client-secret is missing");
    }
    if (isBlank(authConfig.telegramBotToken().orElse(null))) {
      return Optional.of("auth.telegram-bot-token is missing");
    }
    if (isLocalUrl(authConfig.apiPublicUrl())) {
      return Optional.of("auth.api-public-url must not point to localhost in production");
    }
    if (isLocalUrl(authConfig.oauthDefaultReturnTo())) {
      return Optional.of("auth.oauth-default-return-to must not point to localhost in production");
    }
    return Optional.empty();
  }

  void validateOnStartup(@Observes StartupEvent ignored) {
    validate().ifPresent(reason -> {
      throw new IllegalStateException("Invalid auth configuration: " + reason);
    });
    authConfig.telegramBotToken()
        .map(String::trim)
        .filter(token -> !token.isEmpty())
        .ifPresent(token -> log.info("event=telegram_auth_configuration_loaded botTokenRef={}",
            fingerprint(token)));
  }

  private String fingerprint(String value) {
    try {
      return HexFormat.of().formatHex(MessageDigest.getInstance("SHA-256")
          .digest(value.getBytes(StandardCharsets.UTF_8))).substring(0, TOKEN_REFERENCE_LENGTH);
    } catch (NoSuchAlgorithmException ex) {
      throw new IllegalStateException("Unable to fingerprint Telegram configuration", ex);
    }
  }

  private boolean isBlank(String value) {
    return value == null || value.isBlank();
  }

  private boolean isProduction() {
    return deploymentEnv != null && deploymentEnv.trim().equalsIgnoreCase("production");
  }

  private boolean isWeakProductionSecret(String value) {
    if (isBlank(value)) {
      return true;
    }
    var normalized = value.trim().toLowerCase(Locale.ROOT);
    return normalized.length() < 32
        || normalized.contains("change-me")
        || normalized.contains("test-secret")
        || normalized.contains("local-development");
  }

  private boolean isLocalUrl(String value) {
    if (isBlank(value)) {
      return false;
    }
    try {
      var host = URI.create(value.trim()).getHost();
      if (host == null) {
        return false;
      }
      var normalized = host.toLowerCase(Locale.ROOT);
      if (normalized.endsWith(".")) {
        normalized = normalized.substring(0, normalized.length() - 1);
      }
      return normalized.equals("localhost")
          || normalized.endsWith(".localhost")
          || isLocalIpAddress(normalized);
    } catch (IllegalArgumentException ignored) {
      return false;
    }
  }

  private boolean isLocalIpAddress(String host) {
    if (!looksLikeIpAddress(host)) {
      return false;
    }
    try {
      var address = InetAddress.getByName(host);
      return address.isLoopbackAddress() || address.isAnyLocalAddress();
    } catch (UnknownHostException ignored) {
      return false;
    }
  }

  private boolean looksLikeIpAddress(String host) {
    return host.indexOf(':') >= 0
        || host.chars().allMatch(character -> Character.isDigit(character) || character == '.');
  }
}
