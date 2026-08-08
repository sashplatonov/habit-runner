package com.sashplatonov.habbit.runner.api;

import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.time.format.DateTimeParseException;
import java.util.Base64;

public final class CursorCodec {
  private CursorCodec() {
  }

  public static String encode(Instant updatedAt, String id) {
    var value = updatedAt.toString() + "\n" + id;
    return Base64.getUrlEncoder().withoutPadding().encodeToString(value.getBytes(StandardCharsets.UTF_8));
  }

  public static Cursor decode(String encoded) {
    byte[] decodedBytes;
    try {
      decodedBytes = Base64.getUrlDecoder().decode(encoded);
    } catch (IllegalArgumentException exception) {
      throw new IllegalArgumentException("Malformed cursor", exception);
    }
    var value = new String(decodedBytes, StandardCharsets.UTF_8);
    var separator = value.indexOf('\n');
    if (separator <= 0 || separator == value.length() - 1) {
      throw new IllegalArgumentException("Malformed cursor");
    }
    try {
      return new Cursor(Instant.parse(value.substring(0, separator)), value.substring(separator + 1));
    } catch (DateTimeParseException exception) {
      throw new IllegalArgumentException("Malformed cursor", exception);
    }
  }

  public record Cursor(Instant updatedAt, String id) {
  }
}
