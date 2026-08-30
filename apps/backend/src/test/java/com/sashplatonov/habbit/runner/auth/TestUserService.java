package com.sashplatonov.habbit.runner.auth;

import com.sashplatonov.habbit.runner.auth.service.UserService;
import com.sashplatonov.habbit.runner.model.UserEntity;

final class TestUserService extends UserService {
  private UserEntity existingUser;
  private boolean createInvoked;

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
