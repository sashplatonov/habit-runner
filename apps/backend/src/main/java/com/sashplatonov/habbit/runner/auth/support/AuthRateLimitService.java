package com.sashplatonov.habbit.runner.auth.support;

import jakarta.enterprise.context.ApplicationScoped;

import java.time.Duration;
import java.time.Instant;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@ApplicationScoped
public class AuthRateLimitService {
  private static final int MAX_BUCKETS = 10_000;
  private final Map<String, AuthRateLimitBucket> buckets = new ConcurrentHashMap<>();
  private final AuthRateLimitBucket overflowBucket = new AuthRateLimitBucket();
  private final Object bucketLock = new Object();

  public void checkIp(String operation, String clientIp, int limit, Duration window) {
    check(key(operation, "ip", clientIp), limit, window);
  }

  public void checkIp(String operation, String clientIp, int limit, long windowSeconds) {
    check(key(operation, "ip", clientIp), limit, Duration.ofSeconds(windowSeconds));
  }

  public void checkAccount(String operation, String accountId, int limit, Duration window) {
    check(key(operation, "account", accountId), limit, window);
  }

  protected Instant now() {
    return Instant.now();
  }

  private void check(String key, int limit, Duration window) {
    var currentTime = now();
    var bucket = bucketFor(key, currentTime);
    var resetAt = bucket.tryAcquire(currentTime, limit, window);
    if (resetAt != null) {
      throw new AuthRateLimitException(Math.max(1L, Duration.between(currentTime, resetAt).toSeconds()));
    }
  }

  private AuthRateLimitBucket bucketFor(String key, Instant now) {
    synchronized (bucketLock) {
      var existing = buckets.get(key);
      if (existing != null) {
        return existing;
      }
      if (buckets.size() >= MAX_BUCKETS) {
        buckets.entrySet().removeIf(entry -> entry.getValue().isExpiredAt(now));
      }
      if (buckets.size() >= MAX_BUCKETS) {
        return overflowBucket;
      }
      var bucket = new AuthRateLimitBucket();
      buckets.put(key, bucket);
      return bucket;
    }
  }

  private static String key(String operation, String scope, String value) {
    var normalizedValue = value == null || value.isBlank() ? "unknown" : value.trim();
    if (normalizedValue.length() > 256) {
      normalizedValue = normalizedValue.substring(0, 256);
    }
    return operation + ":" + scope + ":" + normalizedValue;
  }
}
