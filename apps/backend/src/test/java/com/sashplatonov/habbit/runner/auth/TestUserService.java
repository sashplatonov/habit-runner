package com.sashplatonov.habbit.runner.auth;

import com.sashplatonov.habbit.runner.auth.service.UserService;
import com.sashplatonov.habbit.runner.model.UserEntity;
import com.sashplatonov.habbit.runner.repository.UserRepository;

import static org.mockito.Mockito.mock;

final class TestUserService extends UserService {
  private UserEntity existingUser;
  private boolean createInvoked;

  TestUserService() {
    super(mock(UserRepository.class));
  }

  void setExistingUser(UserEntity existingUser) {
    this.existingUser = existingUser;
  }

  boolean isCreateInvoked() {
    return createInvoked;
  }

  @Override
  protected UserEntity findByEmail(String email) {
    return existingUser;
  }

  @Override
  protected UserEntity createUser(String email) {
    createInvoked = true;
    return AuthServiceUnitCoverageTest.user("created-user", email);
  }
}
