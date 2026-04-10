package com.habittracker.auth;

import com.habittracker.model.UserEntity;
import jakarta.enterprise.context.ApplicationScoped;
import lombok.extern.slf4j.Slf4j;

@ApplicationScoped
@Slf4j
public class UserService {
  public UserEntity findOrCreateUser(String email) {
    var user = findByEmail(email);
    if (user != null) {
      return user;
    }

    var createdUser = createUser(email);
    log.info("Created OAuth user: userId={}, provider=google", createdUser.id);
    return createdUser;
  }

  protected UserEntity findByEmail(String email) {
    return UserEntity.<UserEntity>find("email", email).firstResult();
  }

  protected UserEntity createUser(String email) {
    var user = new UserEntity();
    user.email = email;
    user.persist();
    return user;
  }
}
