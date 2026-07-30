package com.sashplatonov.habbit.runner.auth;

import com.sashplatonov.habbit.runner.auth.support.AuthRateLimitException;
import com.sashplatonov.habbit.runner.auth.support.AuthRateLimitService;
import org.junit.jupiter.api.Test;

import java.time.Duration;

import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

class AuthRateLimitServiceTest {

  @Test
  void shouldAllowRequestsUntilTheLimitIsReachedAndThenRejectWithRetryAfter() {
    var service = new AuthRateLimitService();

    for (var i = 0; i < 3; i++) {
      service.checkIp("auth:refresh", "198.51.100.7", 3, Duration.ofMinutes(1));
    }

    var exception = assertThrows(
        AuthRateLimitException.class,
        () -> service.checkIp("auth:refresh", "198.51.100.7", 3, Duration.ofMinutes(1))
    );

    assertTrue(exception.retryAfterSeconds() > 0);
  }

  @Test
  void shouldFailClosedWithoutGrowingPastTheBucketLimit() {
    var service = new AuthRateLimitService();

    for (var i = 0; i < 10_002; i++) {
      service.checkIp("auth:google:start", "198.51.100." + i, 2, Duration.ofMinutes(1));
    }

    assertThrows(
        AuthRateLimitException.class,
        () -> service.checkIp("auth:google:start", "198.51.100.overflow", 2, Duration.ofMinutes(1))
    );
  }
}
