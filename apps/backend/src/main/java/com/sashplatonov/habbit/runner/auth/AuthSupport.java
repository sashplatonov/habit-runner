package com.sashplatonov.habbit.runner.auth;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.security.SecureRandom;
import java.util.HexFormat;

final class AuthSupport {
  private AuthSupport() {
  }

  static String randomToken(int bytes) {
    var random = new byte[bytes];
    new SecureRandom().nextBytes(random);
    return HexFormat.of().formatHex(random);
  }

  static String urlEncode(String value) {
    return URLEncoder.encode(value, StandardCharsets.UTF_8);
  }
}
