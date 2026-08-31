package com.sashplatonov.habbit.runner.auth.service;

import com.sashplatonov.habbit.runner.auth.identity.AccountLinkService;
import com.sashplatonov.habbit.runner.auth.support.AuthenticatedSession;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;

/**
 * Completes a Telegram account-link challenge and issues the session for the
 * linking owner in one call so resources stay free of session assembly.
 */
@ApplicationScoped
public class TelegramLinkCompletionService {
  private final AccountLinkService accountLinkService;
  private final TokenIssuer tokenIssuer;

  @Inject
  public TelegramLinkCompletionService(AccountLinkService accountLinkService, TokenIssuer tokenIssuer) {
    this.accountLinkService = accountLinkService;
    this.tokenIssuer = tokenIssuer;
  }

  public AuthenticatedSession complete(String token, String initData) {
    var ownerUserId = accountLinkService.completeTelegramLink(token, initData);
    return tokenIssuer.issueForUserId(ownerUserId);
  }
}
