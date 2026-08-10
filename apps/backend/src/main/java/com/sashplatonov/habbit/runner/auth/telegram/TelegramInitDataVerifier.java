package com.sashplatonov.habbit.runner.auth.telegram;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.sashplatonov.habbit.runner.auth.config.AuthConfig;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.ws.rs.BadRequestException;
import java.net.URLDecoder;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.Instant;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HexFormat;
import java.util.Map;
import java.util.Optional;
import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import lombok.extern.slf4j.Slf4j;

@ApplicationScoped
@Slf4j
public class TelegramInitDataVerifier {
  private static final int FINGERPRINT_LENGTH = 12;
  @jakarta.inject.Inject
  AuthConfig authConfig;
  @jakarta.inject.Inject
  ObjectMapper objectMapper;

  TelegramInitDataVerifier(AuthConfig authConfig, ObjectMapper objectMapper) {
    this.authConfig = authConfig;
    this.objectMapper = objectMapper;
  }

  public TelegramWebAppUser verify(String rawInitData) {
    validateConfigured(rawInitData);
    var fields = parse(rawInitData);
    var hash = fields.remove("hash");
    validateFields(hash, fields);
    validateFreshness(fields.get("auth_date"));
    validateHash(hash, fields);
    try {
      return objectMapper.readValue(fields.get("user"), TelegramWebAppUser.class);
    } catch (JsonProcessingException ex) {
      throw new BadRequestException("Invalid Telegram user", ex);
    }
  }

  private void validateConfigured(String rawInitData) {
    if (rawInitData == null || rawInitData.isBlank() || configuredBotToken().isEmpty()) {
      throw new BadRequestException("Telegram authentication is not configured");
    }
  }

  private void validateFields(String hash, Map<String, String> fields) {
    if (hash == null || fields.get("auth_date") == null || fields.get("user") == null) {
      throw new BadRequestException("Invalid Telegram initData");
    }
  }

  private void validateFreshness(String value) {
    final long authDate;
    try {
      authDate = Long.parseLong(value);
    } catch (NumberFormatException ex) {
      throw new BadRequestException("Invalid Telegram auth_date", ex);
    }
    var now = Instant.now().getEpochSecond();
    if (authDate > now + 60 || now - authDate > authConfig.telegramInitDataMaxAgeSeconds()) {
      throw new BadRequestException("Expired Telegram initData");
    }
  }

  private void validateHash(String hash, Map<String, String> fields) {
    final byte[] provided;
    try {
      provided = HexFormat.of().parseHex(hash);
    } catch (IllegalArgumentException ex) {
      throw new BadRequestException("Invalid Telegram hash", ex);
    }
    var expected = hmac(hmac(configuredBotToken().orElseThrow(), "WebAppData"), dataCheckString(fields));
    if (!MessageDigest.isEqual(expected, provided)) {
      log.warn("event=telegram_init_data_rejected reason=invalid_hash botTokenRef={} telegramUserRef={} authDate={}",
          fingerprint(configuredBotToken().orElseThrow()), fingerprint(fields.get("user")), fields.get("auth_date"));
      throw new BadRequestException("Invalid Telegram hash");
    }
  }

  private String dataCheckString(Map<String, String> fields) {
    var result = new ArrayList<String>();
    fields.entrySet().stream().sorted(Comparator.comparing(Map.Entry::getKey))
        .forEach(entry -> result.add(entry.getKey() + "=" + entry.getValue()));
    return String.join("\n", result);
  }

  private Map<String, String> parse(String raw) {
    var fields = new java.util.HashMap<String, String>();
    for (var pair : raw.split("&")) {
      var separator = pair.indexOf('=');
      if (separator <= 0) {
        throw new BadRequestException("Invalid Telegram initData");
      }
      fields.put(decode(pair.substring(0, separator)), decode(pair.substring(separator + 1)));
    }
    return fields;
  }

  private String decode(String value) {
    return URLDecoder.decode(value, StandardCharsets.UTF_8);
  }

  private Optional<String> configuredBotToken() {
    return authConfig.telegramBotToken().map(String::trim).filter(token -> !token.isEmpty());
  }

  private String fingerprint(String value) {
    try {
      return HexFormat.of().formatHex(MessageDigest.getInstance("SHA-256")
          .digest(value.getBytes(StandardCharsets.UTF_8))).substring(0, FINGERPRINT_LENGTH);
    } catch (java.security.NoSuchAlgorithmException ex) {
      throw new IllegalStateException("Unable to fingerprint Telegram authentication data", ex);
    }
  }

  private byte[] hmac(String key, String value) {
    return hmac(key.getBytes(StandardCharsets.UTF_8), value);
  }

  private byte[] hmac(byte[] key, String value) {
    try {
      var mac = Mac.getInstance("HmacSHA256");
      mac.init(new SecretKeySpec(key, "HmacSHA256"));
      return mac.doFinal(value.getBytes(StandardCharsets.UTF_8));
    } catch (java.security.GeneralSecurityException ex) {
      throw new IllegalStateException("Unable to verify Telegram initData", ex);
    }
  }
}
