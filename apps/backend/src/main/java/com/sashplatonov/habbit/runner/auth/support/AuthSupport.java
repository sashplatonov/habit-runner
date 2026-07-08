package com.sashplatonov.habbit.runner.auth.support;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.security.SecureRandom;
import java.util.HexFormat;

public final class AuthSupport {
  private static final ThreadLocal<SecureRandom> SECURE_RANDOM = ThreadLocal.withInitial(SecureRandom::new);

  private AuthSupport() {
  }

  public static String randomToken(int bytes) {
    var bytesArray = new byte[bytes];
    SECURE_RANDOM.get().nextBytes(bytesArray);
    return HexFormat.of().formatHex(bytesArray);
  }

  public static String urlEncode(String value) {
    return URLEncoder.encode(value, StandardCharsets.UTF_8);
  }
}
