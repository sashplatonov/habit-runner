package com.habittracker.auth;

import com.habittracker.model.UserEntity;
import jakarta.enterprise.context.ApplicationScoped;
import lombok.extern.slf4j.Slf4j;

@ApplicationScoped
@Slf4j
public class UserService {
  public UserEntity findOrCreateUser(String email) {
    var user = UserEntity.<UserEntity>find("email", email).firstResult();
    if (user != null) {
      return user;
    }

    var createdUser = new UserEntity();
    createdUser.email = email;
    createdUser.persist();
    log.info("Created OAuth user: userId={}, provider=google", createdUser.id);
    return createdUser;
  }
}
