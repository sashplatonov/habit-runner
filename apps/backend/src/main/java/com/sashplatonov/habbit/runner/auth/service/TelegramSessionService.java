package com.sashplatonov.habbit.runner.auth.service;

import com.sashplatonov.habbit.runner.auth.dto.TokenResponse;
import com.sashplatonov.habbit.runner.auth.identity.IdentityService;
import com.sashplatonov.habbit.runner.auth.support.AuthenticatedSession;
import com.sashplatonov.habbit.runner.auth.telegram.TelegramWebAppUser;
import com.sashplatonov.habbit.runner.metrics.instrumentation.ServiceMetric;
import com.sashplatonov.habbit.runner.metrics.instrumentation.ServiceMetricsInstrumentation;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;
import jakarta.ws.rs.BadRequestException;

@ApplicationScoped
public class TelegramSessionService {
  private final IdentityService identityService;
  private final UserService userService;
  private final TokenIssuer tokenIssuer;
  private final ServiceMetricsInstrumentation serviceMetricsInstrumentation;

  @Inject
  public TelegramSessionService(
      IdentityService identityService,
      UserService userService,
      TokenIssuer tokenIssuer,
      ServiceMetricsInstrumentation serviceMetricsInstrumentation
  ) {
    this.identityService = identityService;
    this.userService = userService;
    this.tokenIssuer = tokenIssuer;
    this.serviceMetricsInstrumentation = serviceMetricsInstrumentation;
  }

  @Transactional
  public AuthenticatedSession authenticate(TelegramWebAppUser telegramUser) {
    if (telegramUser == null || telegramUser.id() <= 0) {
      throw new BadRequestException("Invalid Telegram user");
    }
    var displayName = telegramUser.username() == null || telegramUser.username().isBlank()
        ? null : "@" + telegramUser.username();
    var resolution = identityService.resolveTelegram(Long.toString(telegramUser.id()), displayName);
    var user = userService.findRequiredUserById(resolution.userId());
    var session = tokenIssuer.issue(user);
    serviceMetricsInstrumentation.record(ServiceMetric.AUTH_LOGIN_SUCCESS_GOOGLE);
    return new AuthenticatedSession(
        withExistingAccount(session.token(), resolution.existingAccount()),
        session.user()
    );
  }

  private TokenResponse withExistingAccount(TokenResponse token, boolean existingAccount) {
    return new TokenResponse(
        token.accessToken(), token.refreshToken(), token.expiresIn(), token.tokenType(), existingAccount);
  }
}
