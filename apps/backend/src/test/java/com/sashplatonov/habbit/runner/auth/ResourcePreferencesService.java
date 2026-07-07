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
import com.sashplatonov.habbit.runner.auth.dto.UpdatePreferencesRequest;
import com.sashplatonov.habbit.runner.auth.dto.UserPreferencesResponse;

public class ResourcePreferencesService extends PreferencesService {
  private String lastUserId;
  private UpdatePreferencesRequest lastRequest;
  private UserPreferencesResponse getResponse;
  private UserPreferencesResponse updateResponse;

  public void setGetResponse(UserPreferencesResponse r) { this.getResponse = r; }
  public void setUpdateResponse(UserPreferencesResponse r) { this.updateResponse = r; }
  public UserPreferencesResponse getGetResponse() { return getResponse; }
  public UserPreferencesResponse getUpdateResponse() { return updateResponse; }
  public String getLastRequestTheme() { return lastRequest == null ? null : lastRequest.theme(); }
  public String getLastUserId() { return lastUserId; }

  @Override
  public UserPreferencesResponse getUserPreferences(String userId) {
    lastUserId = userId;
    return getResponse;
  }

  @Override
  public UserPreferencesResponse updateUserPreferences(String userId, UpdatePreferencesRequest request) {
    lastUserId = userId;
    lastRequest = request;
    return updateResponse;
  }
}
