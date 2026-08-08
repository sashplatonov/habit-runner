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
    var value = decodeValue(encoded);
    var separator = value.indexOf('\n');
    if (separator <= 0 || separator == value.length() - 1) {
      throw new IllegalArgumentException("Malformed cursor");
    }
    return new Cursor(parseInstant(value.substring(0, separator)), value.substring(separator + 1));
  }

  private static String decodeValue(String encoded) {
    try {
      return new String(Base64.getUrlDecoder().decode(encoded), StandardCharsets.UTF_8);
    } catch (IllegalArgumentException exception) {
      throw new IllegalArgumentException("Malformed cursor", exception);
    }
  }

  private static Instant parseInstant(String value) {
    try {
      return Instant.parse(value);
    } catch (DateTimeParseException exception) {
      throw new IllegalArgumentException("Malformed cursor", exception);
    }
  }
}
