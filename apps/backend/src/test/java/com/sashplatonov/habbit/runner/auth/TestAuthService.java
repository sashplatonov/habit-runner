package com.sashplatonov.habbit.runner.auth;

import com.sashplatonov.habbit.runner.auth.client.GoogleOAuthClient;
import com.sashplatonov.habbit.runner.auth.config.AuthConfig;
import com.sashplatonov.habbit.runner.auth.resource.AuthResource;
import com.sashplatonov.habbit.runner.auth.resource.AuthThemeResource;
import com.sashplatonov.habbit.runner.auth.security.AuthGuardFilter;
import com.sashplatonov.habbit.runner.auth.security.BearerTokenExtractor;
import com.sashplatonov.habbit.runner.auth.security.CurrentUser;
import com.sashplatonov.habbit.runner.auth.security.CurrentUserContext;
import com.sashplatonov.habbit.runner.auth.security.CsrfGuardFilter;
import com.sashplatonov.habbit.runner.auth.security.JwtUtil;
import com.sashplatonov.habbit.runner.auth.security.RequireAuth;
import com.sashplatonov.habbit.runner.auth.service.AuthService;
import com.sashplatonov.habbit.runner.auth.service.PreferencesService;
import com.sashplatonov.habbit.runner.auth.service.RefreshTokenService;
import com.sashplatonov.habbit.runner.auth.support.AuthCollaborators;
import com.sashplatonov.habbit.runner.auth.support.AuthCookieBuilder;
import com.sashplatonov.habbit.runner.auth.support.AuthSupport;
import com.sashplatonov.habbit.runner.auth.support.AuthServiceSupport;
import com.sashplatonov.habbit.runner.auth.support.OAuthCallbackSession;
import com.sashplatonov.habbit.runner.auth.support.OAuthHelper;
import com.sashplatonov.habbit.runner.auth.support.OAuthSupport;
import com.sashplatonov.habbit.runner.auth.support.ThemeCatalog;
import com.sashplatonov.habbit.runner.model.OAuthStateEntity;
import com.sashplatonov.habbit.runner.model.UserEntity;
import com.sashplatonov.habbit.runner.support.TestConfigFactory;

import java.time.Instant;

final class TestAuthService extends AuthService {
  private final TestOAuthStateAccess oauthStateAccess;
  private Instant currentTime = Instant.parse("2026-04-10T13:00:00Z");

  TestAuthService(StubCollaborators collaborators) {
    this(collaborators, new TestOAuthStateAccess());
  }

  TestAuthService(StubCollaborators collaborators, TestOAuthStateAccess oauthStateAccess) {
    super(
        TestConfigFactory.defaultAuthConfig(),
        collaborators,
        oauthStateAccess,
        new AuthServiceSupport(null, null)
    );
    this.oauthStateAccess = oauthStateAccess;
  }

  void setUserById(UserEntity userById) {
    ((StubCollaborators) collaborators).setUserById(userById);
  }

  void setOauthState(OAuthStateEntity oauthState) {
    oauthStateAccess.setOauthState(oauthState);
  }

  StoredState getStoredState() {
    return oauthStateAccess.getStoredState();
  }

  String getDeletedState() {
    return oauthStateAccess.getDeletedState();
  }

  void setCurrentTime(Instant currentTime) {
    this.currentTime = currentTime;
  }

  @Override
  protected Instant now() {
    return currentTime;
  }
}
