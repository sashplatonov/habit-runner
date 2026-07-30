package com.sashplatonov.habbit.runner.auth.support;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.HexFormat;

public final class RefreshTokenDigest {
  private RefreshTokenDigest() {
  }

  public static String hash(String token) {
    if (token == null || token.isBlank()) {
      throw new IllegalArgumentException("Refresh token is required");
    }
    try {
      var digest = MessageDigest.getInstance("SHA-256").digest(token.getBytes(StandardCharsets.UTF_8));
      return HexFormat.of().formatHex(digest);
    } catch (NoSuchAlgorithmException ex) {
      throw new IllegalStateException("SHA-256 is not available", ex);
    }
  }
}
