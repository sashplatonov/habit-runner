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
import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;

@ApplicationScoped
public class TelegramInitDataVerifier {
  private final AuthConfig authConfig;
  private final ObjectMapper objectMapper;

  public TelegramInitDataVerifier(AuthConfig authConfig, ObjectMapper objectMapper) {
    this.authConfig = authConfig;
    this.objectMapper = objectMapper;
  }

  public TelegramWebAppUser verify(String rawInitData) {
    if (rawInitData == null || rawInitData.isBlank() || authConfig.telegramBotToken().isEmpty()) {
      throw new BadRequestException("Telegram authentication is not configured");
    }
    var fields = parse(rawInitData);
    var hash = fields.remove("hash");
    if (hash == null || fields.get("auth_date") == null || fields.get("user") == null) {
      throw new BadRequestException("Invalid Telegram initData");
    }
    long authDate;
    try {
      authDate = Long.parseLong(fields.get("auth_date"));
    } catch (NumberFormatException ex) {
      throw new BadRequestException("Invalid Telegram auth_date", ex);
    }
    var now = Instant.now().getEpochSecond();
    if (authDate > now + 60 || now - authDate > authConfig.telegramInitDataMaxAgeSeconds()) {
      throw new BadRequestException("Expired Telegram initData");
    }
    var expected = hmac(hmac(authConfig.telegramBotToken().orElseThrow(), "WebAppData"), dataCheckString(fields));
    final byte[] provided;
    try {
      provided = HexFormat.of().parseHex(hash);
    } catch (IllegalArgumentException ex) {
      throw new BadRequestException("Invalid Telegram hash", ex);
    }
    if (!MessageDigest.isEqual(expected, provided)) {
      throw new BadRequestException("Invalid Telegram hash");
    }
    try {
      return objectMapper.readValue(fields.get("user"), TelegramWebAppUser.class);
    } catch (JsonProcessingException ex) {
      throw new BadRequestException("Invalid Telegram user", ex);
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
