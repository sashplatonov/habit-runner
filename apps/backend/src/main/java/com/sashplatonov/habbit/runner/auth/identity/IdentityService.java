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
  private final AuthIdentityRepository identityRepository;
  private final UserRepository userRepository;

  @Inject
  public IdentityService(AuthIdentityRepository identityRepository, UserRepository userRepository) {
    this.identityRepository = identityRepository;
    this.userRepository = userRepository;
  }

  public AuthIdentityEntity find(AuthProvider provider, String providerSubject) {
    if (providerSubject == null || providerSubject.isBlank()) {
      return null;
    }
    return identityRepository.findByProviderAndSubject(provider, providerSubject);
  }

  @Transactional
  public UserEntity findOrCreateTelegram(String providerSubject) {
    var existing = find(AuthProvider.TELEGRAM, providerSubject);
    if (existing != null) {
      return userRepository.findRequiredById(existing.getUserId());
    }

    var user = new UserEntity();
    userRepository.save(user);

    var identity = new AuthIdentityEntity();
    identity.setProvider(AuthProvider.TELEGRAM);
    identity.setProviderSubject(providerSubject);
    identity.setUserId(user.getId());
    identityRepository.save(identity);
    return user;
  }
}
