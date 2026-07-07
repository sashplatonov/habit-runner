package com.sashplatonov.habbit.runner.auth;

import com.sashplatonov.habbit.runner.auth.access.OAuthStateAccess;
import com.sashplatonov.habbit.runner.auth.access.UserAccess;
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
import com.sashplatonov.habbit.runner.auth.service.UserService;
import com.sashplatonov.habbit.runner.auth.support.AuthCollaborators;
import com.sashplatonov.habbit.runner.auth.support.AuthCookieBuilder;
import com.sashplatonov.habbit.runner.auth.support.AuthSupport;
import com.sashplatonov.habbit.runner.auth.support.OAuthCallbackSession;
import com.sashplatonov.habbit.runner.auth.support.OAuthHelper;
import com.sashplatonov.habbit.runner.auth.support.OAuthSupport;
import com.sashplatonov.habbit.runner.auth.support.ThemeCatalog;
import com.sashplatonov.habbit.runner.model.RefreshTokenEntity;

import java.time.Instant;

final class TestRefreshTokenService extends RefreshTokenService {
  private RefreshTokenEntity recordByToken;
  private RefreshTokenEntity persistedRecord;
  private Instant currentTime = Instant.parse("2026-04-10T14:00:00Z");

  void setRecordByToken(RefreshTokenEntity recordByToken) {
    this.recordByToken = recordByToken;
  }

  RefreshTokenEntity getRecordByToken() {
    return recordByToken;
  }

  RefreshTokenEntity getPersistedRecord() {
    return persistedRecord;
  }

  void setCurrentTime(Instant currentTime) {
    this.currentTime = currentTime;
  }

  @Override
  protected RefreshTokenEntity findByToken(String token) {
    return recordByToken;
  }

  @Override
  protected RefreshTokenEntity newRefreshToken() {
    return new RefreshTokenEntity();
  }

  @Override
  protected void persistRefreshToken(RefreshTokenEntity refresh) {
    persistedRecord = refresh;
  }

  @Override
  protected Instant now() {
    return currentTime;
  }
}
