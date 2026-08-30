package com.sashplatonov.habbit.runner.auth;

import com.sashplatonov.habbit.runner.auth.security.CurrentUser;
import com.sashplatonov.habbit.runner.auth.security.JwtUtil;
import com.sashplatonov.habbit.runner.support.TestConfigFactory;

final class TestAuthJwtUtil extends JwtUtil {
  private IllegalArgumentException verifyFailure;

  TestAuthJwtUtil() {
    super(TestConfigFactory.defaultAuthConfig());
  }

  void setVerifyFailure(IllegalArgumentException verifyFailure) {
    this.verifyFailure = verifyFailure;
  }

  @Override
  public String createAccessToken(String userId, String email, int ttlSeconds) {
    return "access::" + userId + "::" + email + "::" + ttlSeconds;
  }

  @Override
  public CurrentUser verify(String token) {
    if (verifyFailure != null) {
      throw verifyFailure;
    }
    return new CurrentUser("verified-user", "verified@example.test");
  }
}
