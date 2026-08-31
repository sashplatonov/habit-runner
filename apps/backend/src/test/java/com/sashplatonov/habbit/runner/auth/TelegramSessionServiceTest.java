package com.sashplatonov.habbit.runner.auth;

import com.sashplatonov.habbit.runner.auth.service.TelegramSessionService;
import com.sashplatonov.habbit.runner.auth.service.TokenIssuer;
import com.sashplatonov.habbit.runner.auth.telegram.TelegramWebAppUser;
import com.sashplatonov.habbit.runner.metrics.instrumentation.ServiceMetricsInstrumentation;
import com.sashplatonov.habbit.runner.repository.AuthIdentityRepository;
import com.sashplatonov.habbit.runner.repository.UserRepository;
import com.sashplatonov.habbit.runner.support.TestConfigFactory;
import jakarta.ws.rs.BadRequestException;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.mock;

class TelegramSessionServiceTest {

  private TelegramSessionService service(TestAuthUserService userService) {
    return new TelegramSessionService(
        new TestIdentityService(mock(AuthIdentityRepository.class), mock(UserRepository.class)),
        userService,
        new TokenIssuer(
            new TestAuthJwtUtil(),
            new TestAuthRefreshTokenService(),
            TestConfigFactory.defaultAuthConfig(),
            userService
        ),
        mock(ServiceMetricsInstrumentation.class)
    );
  }

  @Test
  void shouldRejectInvalidTelegramUser() {
    var service = service(new TestAuthUserService());

    assertThrows(BadRequestException.class, () -> service.authenticate(null));
    assertThrows(BadRequestException.class, () -> service.authenticate(new TelegramWebAppUser(0, "alice", null, null)));
  }

  @Test
  void shouldIssueSessionForVerifiedTelegramUser() {
    var userService = new TestAuthUserService();
    userService.setUserById(AuthServiceUnitCoverageTest.user("telegram-user", null));
    var service = service(userService);

    var session = service.authenticate(new TelegramWebAppUser(42, "alice", null, null));

    assertEquals("access::telegram-user::null::3600", session.token().accessToken());
    assertEquals("refresh::telegram-user::30", session.token().refreshToken());
    assertEquals(3600, session.token().expiresIn());
    assertEquals("Bearer", session.token().tokenType());
    assertEquals("telegram-user", session.user().id());
  }
}
