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

  public UserService() {
    this(null);
  }

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

  protected UserEntity findByEmail(String email) {
    return userRepository == null
        ? UserEntity.<UserEntity>find("email", email).firstResult()
        : userRepository.findByEmail(email);
  }

  protected UserEntity createUser(String email) {
    var user = new UserEntity();
    user.email = email;
    if (userRepository != null) {
      userRepository.save(user);
    } else {
      user.persist();
    }
    return user;
  }
}
