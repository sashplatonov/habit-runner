package com.sashplatonov.habbit.runner.auth;

import com.sashplatonov.habbit.runner.auth.service.TokenIssuer;
import com.sashplatonov.habbit.runner.support.TestConfigFactory;
import jakarta.ws.rs.NotAuthorizedException;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;

class TokenIssuerTest {

  private TokenIssuer service(TestAuthUserService userService) {
    return new TokenIssuer(
        new TestAuthJwtUtil(),
        new TestAuthRefreshTokenService(),
        TestConfigFactory.defaultAuthConfig(),
        userService
    );
  }

  @Test
  void shouldIssueCanonicalSessionAfterTelegramPairingMerge() {
    var userService = new TestAuthUserService();
    userService.setUserById(AuthServiceUnitCoverageTest.user("owner", "owner@example.test"));
    var service = service(userService);

    var session = service.issueForUserId("owner");

    assertEquals("access::owner::owner@example.test::3600", session.token().accessToken());
    assertEquals("owner", session.user().id());
    assertEquals("owner@example.test", session.user().email());
  }

  @Test
  void shouldRejectCanonicalSessionWhenOwnerWasRemoved() {
    var service = service(new TestAuthUserService());

    assertThrows(NotAuthorizedException.class, () -> service.issueForUserId("missing"));
  }
}
