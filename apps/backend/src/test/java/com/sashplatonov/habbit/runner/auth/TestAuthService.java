package com.sashplatonov.habbit.runner.auth;

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
  protected UserAccess userAccess() {
    return new UserAccess() {
      @Override
      public UserEntity findByEmail(String email) {
        return userByEmail;
      }

      @Override
      public UserEntity findRequiredById(String userId) {
        return userById;
      }
    };
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
