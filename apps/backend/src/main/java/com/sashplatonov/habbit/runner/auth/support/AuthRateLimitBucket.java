package com.sashplatonov.habbit.runner.auth.support;

import java.time.Duration;
import java.time.Instant;

final class AuthRateLimitBucket {
  private Instant windowStartedAt;
  private Instant expiresAt;
  private int count;

  Instant tryAcquire(Instant now, int limit, Duration window) {
    synchronized (this) {
      if (limit < 1) {
        return now;
      }
      if (windowStartedAt == null || !windowStartedAt.plus(window).isAfter(now)) {
        windowStartedAt = now;
        expiresAt = now.plus(window);
        count = 0;
      }
      if (count < limit) {
        count += 1;
        return null;
      }
      return windowStartedAt.plus(window);
    }
  }

  boolean isExpiredAt(Instant now) {
    synchronized (this) {
      return expiresAt == null || !expiresAt.isAfter(now);
    }
  }
}
