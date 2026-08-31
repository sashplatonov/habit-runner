package com.sashplatonov.habbit.runner.auth.service;

import com.sashplatonov.habbit.runner.model.UserEntity;
import com.sashplatonov.habbit.runner.repository.UserRepository;

import static org.mockito.Mockito.mock;

final class StubUserService extends UserService {
  private UserEntity userById;
  private UserEntity oauthUser;

  StubUserService() {
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
