package com.sashplatonov.habbit.runner.support;

import com.sashplatonov.habbit.runner.model.UserEntity;
import com.sashplatonov.habbit.runner.auth.service.UserService;

public class RecordingUserService extends UserService {
  private UserEntity userResult;
  private String requestedEmail;

  public void setUserResult(UserEntity user) {
    this.userResult = user;
  }

  public String getRequestedEmail() {
    return requestedEmail;
  }

  @Override
  public UserEntity findOrCreateUser(String email) {
    requestedEmail = email;
    return userResult;
  }
}
