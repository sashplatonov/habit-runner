package com.sashplatonov.habbit.runner.auth.access;

import com.sashplatonov.habbit.runner.model.UserEntity;
import com.sashplatonov.habbit.runner.repository.UserRepository;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;

@ApplicationScoped
class RepositoryUserAccess implements UserAccess {
  private final UserRepository userRepository;

  @Inject
  RepositoryUserAccess(UserRepository userRepository) {
    this.userRepository = userRepository;
  }

  @Override
  public UserEntity findByEmail(String email) {
    return userRepository.findByEmail(email);
  }

  @Override
  public UserEntity findRequiredById(String userId) {
    return userRepository.findRequiredById(userId);
  }
}
