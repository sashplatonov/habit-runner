package com.sashplatonov.habbit.runner.auth.support;

public class AuthRateLimitException extends RuntimeException {
  private final long retryAfterSeconds;

  public AuthRateLimitException(long retryAfterSeconds) {
    super("Authentication rate limit exceeded");
    this.retryAfterSeconds = Math.max(1L, retryAfterSeconds);
  }

  public long retryAfterSeconds() {
    return retryAfterSeconds;
  }
}
