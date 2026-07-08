package com.sashplatonov.habbit.runner.auth;

import com.sashplatonov.habbit.runner.auth.access.OAuthStateAccess;
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
import com.sashplatonov.habbit.runner.auth.support.OAuthCallbackSession;
import com.sashplatonov.habbit.runner.auth.support.OAuthHelper;
import com.sashplatonov.habbit.runner.auth.support.OAuthSupport;
import com.sashplatonov.habbit.runner.auth.support.ThemeCatalog;
import com.sashplatonov.habbit.runner.model.OAuthStateEntity;
import com.sashplatonov.habbit.runner.model.UserEntity;
import com.sashplatonov.habbit.runner.support.TestConfigFactory;

import java.time.Instant;

final class TestAuthService extends AuthService {
  private UserEntity userByEmail;
  private UserEntity userById;
  private OAuthStateEntity oauthState;
  private StoredState storedState;
  private String deletedState;
  private Instant currentTime = Instant.parse("2026-04-10T13:00:00Z");

  TestAuthService(StubCollaborators collaborators) {
    super(TestConfigFactory.defaultAuthConfig(), collaborators);
  }

  void setUserByEmail(UserEntity userByEmail) {
    this.userByEmail = userByEmail;
  }

  void setUserById(UserEntity userById) {
    this.userById = userById;
  }

  void setOauthState(OAuthStateEntity oauthState) {
    this.oauthState = oauthState;
  }

  StoredState getStoredState() {
    return storedState;
  }

  String getDeletedState() {
    return deletedState;
  }

  void setCurrentTime(Instant currentTime) {
    this.currentTime = currentTime;
  }

  @Override
  protected UserEntity findUserByEmail(String email) {
    return userByEmail;
  }

  @Override
  protected UserEntity findRequiredUserById(String userId) {
    return userById;
  }

  @Override
  protected OAuthStateAccess oauthStateAccess() {
    return new OAuthStateAccess() {
      @Override
      public OAuthStateEntity consume(String state) {
        deletedState = state;
        return oauthState;
      }

      @Override
      public void save(OAuthStateEntity payload) {
        storedState = new StoredState(payload.state, payload.returnTo, payload.expiry());
      }
    };
  }

  @Override
  protected Instant now() {
    return currentTime;
  }
}
