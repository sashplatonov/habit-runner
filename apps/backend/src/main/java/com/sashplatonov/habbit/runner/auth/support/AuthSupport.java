package com.sashplatonov.habbit.runner.auth.support;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.security.SecureRandom;
import java.util.HexFormat;

public final class AuthSupport {
  private AuthSupport() {
  }

  public static String randomToken(int bytes) {
    // Create SecureRandom on each call to avoid storing in GraalVM image heap
    var random = new SecureRandom();
    var bytesArray = new byte[bytes];
    random.nextBytes(bytesArray);
    return HexFormat.of().formatHex(bytesArray);
  }

  public static String urlEncode(String value) {
    return URLEncoder.encode(value, StandardCharsets.UTF_8);
  }
}
