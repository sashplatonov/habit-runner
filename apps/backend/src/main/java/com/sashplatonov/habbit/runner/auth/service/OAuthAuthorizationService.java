package com.sashplatonov.habbit.runner.auth.service;

import com.sashplatonov.habbit.runner.auth.access.OAuthStateAccess;
import com.sashplatonov.habbit.runner.auth.support.AuthSupport;
import com.sashplatonov.habbit.runner.auth.support.OAuthSupport;
import com.sashplatonov.habbit.runner.model.OAuthStateEntity;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;
import jakarta.ws.rs.NotAuthorizedException;

import java.time.Instant;

@ApplicationScoped
public class OAuthAuthorizationService {
  private final OAuthSupport oauthSupport;
  private final OAuthStateAccess oauthStateAccess;

  @Inject
  public OAuthAuthorizationService(OAuthSupport oauthSupport, OAuthStateAccess oauthStateAccess) {
    this.oauthSupport = oauthSupport;
    this.oauthStateAccess = oauthStateAccess;
  }

  @Transactional
  public String createAuthorizationUrl(String returnTo) {
    return createAuthorizationUrl(returnTo, null);
  }

  @Transactional
  public String createLinkAuthorizationUrl(String ownerUserId, String returnTo) {
    if (ownerUserId == null || ownerUserId.isBlank()) {
      throw new NotAuthorizedException("Authentication required");
    }
    return createAuthorizationUrl(returnTo, ownerUserId);
  }

  private String createAuthorizationUrl(String returnTo, String linkUserId) {
    var state = AuthSupport.randomToken(16);
    var payload = new OAuthStateEntity();
    payload.state = state;
    payload.returnTo = oauthSupport.normalizeReturnTo(returnTo);
    payload.setLinkUserId(linkUserId);
    payload.setExpiry(now().plusSeconds(600));
    oauthStateAccess.save(payload);
    return oauthSupport.buildAuthorizationUrl(state);
  }

  protected Instant now() {
    return Instant.now();
  }
}
