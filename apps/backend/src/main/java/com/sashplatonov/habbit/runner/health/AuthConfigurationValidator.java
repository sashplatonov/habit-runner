package com.sashplatonov.habbit.runner.health;

import com.sashplatonov.habbit.runner.auth.config.AuthConfig;
import io.quarkus.runtime.StartupEvent;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.enterprise.event.Observes;
import jakarta.inject.Inject;
import org.eclipse.microprofile.config.inject.ConfigProperty;

import java.net.InetAddress;
import java.net.URI;
import java.net.UnknownHostException;
import java.util.Locale;
import java.util.Optional;

@ApplicationScoped
class AuthConfigurationValidator {
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
    if (isBlank(authConfig.secret())) {
      return Optional.of("auth.secret is missing");
    }
    if (authConfig.accessTokenTtlSeconds() < 1) {
      return Optional.of("auth.access-token-ttl-seconds must be positive");
    }
    if (authConfig.refreshTokenDays() < 1) {
      return Optional.of("auth.refresh-token-days must be positive");
    }
    if (isBlank(authConfig.apiPublicUrl())) {
      return Optional.of("auth.api-public-url is missing");
    }
    if (isBlank(authConfig.oauthDefaultReturnTo())) {
      return Optional.of("auth.oauth-default-return-to is missing");
    }
    if (isBlank(authConfig.issuer())) {
      return Optional.of("auth.issuer is missing");
    }
    return Optional.empty();
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
