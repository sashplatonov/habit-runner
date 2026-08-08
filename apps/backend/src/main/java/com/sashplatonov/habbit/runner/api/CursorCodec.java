package com.sashplatonov.habbit.runner.api;

import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.Base64;

public final class CursorCodec {
  private CursorCodec() {
  }

  public static String encode(Instant updatedAt, String id) {
    var value = updatedAt.toString() + "\n" + id;
    return Base64.getUrlEncoder().withoutPadding().encodeToString(value.getBytes(StandardCharsets.UTF_8));
  }

  public static Cursor decode(String encoded) {
    try {
      var value = new String(Base64.getUrlDecoder().decode(encoded), StandardCharsets.UTF_8);
      var separator = value.indexOf('\n');
      if (separator <= 0 || separator == value.length() - 1) {
        throw new IllegalArgumentException("Malformed cursor");
      }
      return new Cursor(Instant.parse(value.substring(0, separator)), value.substring(separator + 1));
    } catch (RuntimeException exception) {
      throw new IllegalArgumentException("Malformed cursor", exception);
    }
  }

  public record Cursor(Instant updatedAt, String id) {
  }
}
