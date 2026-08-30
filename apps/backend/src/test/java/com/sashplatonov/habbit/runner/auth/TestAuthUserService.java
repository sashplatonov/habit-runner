package com.sashplatonov.habbit.runner.auth;

import com.sashplatonov.habbit.runner.auth.service.UserService;
import com.sashplatonov.habbit.runner.model.UserEntity;
import com.sashplatonov.habbit.runner.repository.UserRepository;

import static org.mockito.Mockito.mock;

final class TestAuthUserService extends UserService {
  private UserEntity userById;
  private UserEntity oauthUser = AuthServiceUnitCoverageTest.user("oauth-user", "oauth@example.test");

  TestAuthUserService() {
    super(mock(UserRepository.class));
  }

  void setUserById(UserEntity userById) {
    this.userById = userById;
  }

  void setOauthUser(UserEntity oauthUser) {
    this.oauthUser = oauthUser;
  }

  @Override
  public UserEntity findRequiredUserById(String userId) {
    return userById;
  }

  @Override
  public UserEntity findOrCreateUser(String email) {
    return oauthUser;
  }
}
