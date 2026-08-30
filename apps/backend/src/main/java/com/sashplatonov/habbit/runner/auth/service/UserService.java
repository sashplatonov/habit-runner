package com.sashplatonov.habbit.runner.auth.service;

import com.sashplatonov.habbit.runner.model.UserEntity;
import com.sashplatonov.habbit.runner.repository.UserRepository;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import lombok.extern.slf4j.Slf4j;

@ApplicationScoped
@Slf4j
public class UserService {
  private final UserRepository userRepository;

  @Inject
  public UserService(UserRepository userRepository) {
    this.userRepository = userRepository;
  }

  public UserEntity findOrCreateUser(String email) {
    var user = findByEmail(email);
    if (user != null) {
      return user;
    }

    var createdUser = createUser(email);
    log.info("Created OAuth user: userId={}, provider=google", createdUser.getId());
    return createdUser;
  }

  public UserEntity findUserByEmail(String email) {
    return findByEmail(email);
  }

  public UserEntity findRequiredUserById(String userId) {
    return findRequiredById(userId);
  }

  protected UserEntity findByEmail(String email) {
    return userRepository.findByEmail(email);
  }

  protected UserEntity findRequiredById(String userId) {
    return userRepository.findRequiredById(userId);
  }

  protected UserEntity createUser(String email) {
    var user = new UserEntity();
    user.setEmail(email);
    userRepository.save(user);
    return user;
  }
}
