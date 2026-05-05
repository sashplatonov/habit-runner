package com.sashplatonov.habbit.runner.auth;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.security.SecureRandom;
import java.util.HexFormat;

final class AuthSupport {
  private static final String HEX_CHARS = "0123456789ABCDEF";
  
  private AuthSupport() {
  }

  static String randomToken(int bytes) {
    // Create SecureRandom on each call to avoid storing in GraalVM image heap
    var random = new SecureRandom();
    var result = new StringBuilder(bytes * 2);
    var bytesArray = new byte[bytes];
    random.nextBytes(bytesArray);
    for (byte b : bytesArray) {
      result.append(HEX_CHARS.charAt((b >> 4) & 0xF))
             .append(HEX_CHARS.charAt(b & 0xF));
    }
    return result.toString();
  }

  static String urlEncode(String value) {
    return URLEncoder.encode(value, StandardCharsets.UTF_8);
  }
}
