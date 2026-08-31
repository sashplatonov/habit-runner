package com.sashplatonov.habbit.runner.auth.service;

import com.sashplatonov.habbit.runner.auth.access.OAuthStateAccess;
import com.sashplatonov.habbit.runner.auth.support.OAuthCallbackSession;
import com.sashplatonov.habbit.runner.auth.support.OAuthSupport;
import com.sashplatonov.habbit.runner.infrastructure.http.TraceContextSupport;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;
import jakarta.ws.rs.BadRequestException;
import jakarta.ws.rs.NotAuthorizedException;
import lombok.extern.slf4j.Slf4j;

import java.time.Instant;

@ApplicationScoped
@Slf4j
public class OAuthExchangeService {
  private final OAuthSupport oauthSupport;
  private final OAuthStateAccess oauthStateAccess;
  private final OAuthAccountLinkService oauthAccountLinkService;
  private final TokenIssuer tokenIssuer;

  @Inject
  public OAuthExchangeService(
      OAuthSupport oauthSupport,
      OAuthStateAccess oauthStateAccess,
      OAuthAccountLinkService oauthAccountLinkService,
      TokenIssuer tokenIssuer
  ) {
    this.oauthSupport = oauthSupport;
    this.oauthStateAccess = oauthStateAccess;
    this.oauthAccountLinkService = oauthAccountLinkService;
    this.tokenIssuer = tokenIssuer;
  }

  @Transactional
  public OAuthCallbackSession exchange(String code, String state) {
    validateInput(code, state);
    var stateEntity = oauthStateAccess.consume(state);
    if (stateEntity == null || stateEntity.isExpiredAt(now())) {
      log.warn(
          "event=oauth_callback_failed, provider=google, traceId={}, reason=invalid-or-expired-state",
          TraceContextSupport.traceIdOrUnknown()
      );
      throw new NotAuthorizedException("Invalid or expired OAuth state");
    }
    var email = oauthSupport.exchangeCodeForEmail(code);
    var user = oauthAccountLinkService.resolveOrCreate(email, stateEntity.linkUserId());
    var redirectUrl = oauthSupport.buildCallbackRedirect(stateEntity.returnTo);
    log.info(
        "OAuth login succeeded: userId={}, provider=google, traceId={}",
        user.getId(),
        TraceContextSupport.traceIdOrUnknown()
    );
    return new OAuthCallbackSession(redirectUrl, tokenIssuer.issue(user).token());
  }

  private void validateInput(String code, String state) {
    if (code == null || code.isBlank() || state == null || state.isBlank()) {
      log.warn(
          "OAuth callback rejected: provider=google, traceId={}, reason=missing-parameters",
          TraceContextSupport.traceIdOrUnknown()
      );
      throw new BadRequestException("Missing OAuth callback parameters");
    }
  }

  protected Instant now() {
    return Instant.now();
  }
}
