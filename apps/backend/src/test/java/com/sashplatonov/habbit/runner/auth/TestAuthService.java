package com.sashplatonov.habbit.runner.auth;

import com.sashplatonov.habbit.runner.auth.service.AuthService;
import com.sashplatonov.habbit.runner.auth.service.OAuthAccountLinkService;
import com.sashplatonov.habbit.runner.auth.support.AuthServiceSupport;
import com.sashplatonov.habbit.runner.model.OAuthStateEntity;
import com.sashplatonov.habbit.runner.model.UserEntity;
import com.sashplatonov.habbit.runner.support.TestConfigFactory;

import java.time.Instant;
import java.lang.reflect.Field;

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

  void setAccountLinkService(OAuthAccountLinkService linkService) {
    try {
      Field field = AuthService.class.getDeclaredField("oauthAccountLinkService");
      field.setAccessible(true);
      field.set(this, linkService);
    } catch (ReflectiveOperationException exception) {
      throw new AssertionError(exception);
    }
  }

  @Override
  protected Instant now() {
    return currentTime;
  }
}
