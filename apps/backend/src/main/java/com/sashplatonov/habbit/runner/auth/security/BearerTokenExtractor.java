package com.sashplatonov.habbit.runner.auth.security;

public final class BearerTokenExtractor {
  private BearerTokenExtractor() {
  }

  public static String extract(String header) {
    if (header == null || header.isBlank()) {
      return null;
    }
    var parts = header.split(" ", 2);
    if (parts.length != 2 || !"bearer".equalsIgnoreCase(parts[0])) {
      return null;
    }
    return parts[1].trim();
  }
}
