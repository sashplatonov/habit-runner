package com.sashplatonov.habbit.runner.auth.identity;

import com.sashplatonov.habbit.runner.model.AuthIdentityEntity;
import com.sashplatonov.habbit.runner.model.UserEntity;
import com.sashplatonov.habbit.runner.repository.AuthIdentityRepository;
import com.sashplatonov.habbit.runner.repository.UserRepository;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;

@ApplicationScoped
public class IdentityService {
  @Inject
  AuthIdentityRepository identityRepository;
  @Inject
  UserRepository userRepository;

  public AuthIdentityEntity find(AuthProvider provider, String providerSubject) {
    if (providerSubject == null || providerSubject.isBlank()) {
      return null;
    }
    return identityRepository.findByProviderAndSubject(provider, providerSubject);
  }

  @Transactional
  public UserEntity findOrCreateTelegram(String providerSubject) {
    return findOrCreateTelegram(providerSubject, null);
  }

  @Transactional
  public UserEntity findOrCreateTelegram(String providerSubject, String displayName) {
    var existing = find(AuthProvider.TELEGRAM, providerSubject);
    if (existing != null) {
      if (displayName != null && !displayName.isBlank()) {
        existing.setDisplayName(displayName);
      }
      return userRepository.findRequiredById(existing.getUserId());
    }

    var user = new UserEntity();
    userRepository.save(user);

    var identity = new AuthIdentityEntity();
    identity.setProvider(AuthProvider.TELEGRAM);
    identity.setProviderSubject(providerSubject);
    identity.setUserId(user.getId());
    identity.setDisplayName(displayName);
    identityRepository.save(identity);
    return user;
  }
}
