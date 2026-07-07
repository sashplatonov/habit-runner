package com.sashplatonov.habbit.runner.support;

import com.sashplatonov.habbit.runner.auth.security.CurrentUser;
import com.sashplatonov.habbit.runner.auth.security.JwtUtil;

public class RecordingJwtUtil extends JwtUtil {
  public String verifiedToken;

  public RecordingJwtUtil() {
    super(TestConfigFactory.defaultAuthConfig());
  }

  @Override
  public String createAccessToken(String userId, String email, int ttlSeconds) {
    return "access::" + userId + "::" + email + "::" + ttlSeconds;
  }

  @Override
  public CurrentUser verify(String token) {
    verifiedToken = token;
    return new CurrentUser("verified-user", "verified@example.test");
  }
}
