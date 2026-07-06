package com.sashplatonov.habbit.runner.auth;

import com.sashplatonov.habbit.runner.model.UserEntity;

public interface UserAccess {
  UserEntity findByEmail(String email);
  UserEntity findRequiredById(String userId);
}
