package com.sashplatonov.habbit.runner.auth;

import com.sashplatonov.habbit.runner.model.UserEntity;

final class TestPreferencesService extends PreferencesService {
  private UserEntity userById;

  void setUserById(UserEntity userById) {
    this.userById = userById;
  }

  @Override
  protected UserEntity findUserById(String userId) {
    return userById;
  }
}
