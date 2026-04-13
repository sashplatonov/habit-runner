package com.sashplatonov.habbit.runner.repository;

import com.sashplatonov.habbit.runner.model.UserEntity;
import io.quarkus.hibernate.orm.panache.PanacheRepositoryBase;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.transaction.Transactional;

@ApplicationScoped
public class UserRepository implements PanacheRepositoryBase<UserEntity, String> {

  public UserEntity findByEmail(String email) {
    return find("email", email).firstResult();
  }

  public UserEntity findRequiredById(String userId) {
    return findById(userId);
  }

  @Transactional
  public void save(UserEntity user) {
    persist(user);
  }
}
