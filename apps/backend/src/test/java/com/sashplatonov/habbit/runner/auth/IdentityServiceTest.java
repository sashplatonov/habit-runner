package com.sashplatonov.habbit.runner.auth;

import com.sashplatonov.habbit.runner.auth.identity.AuthProvider;
import com.sashplatonov.habbit.runner.auth.identity.IdentityService;
import com.sashplatonov.habbit.runner.model.AuthIdentityEntity;
import com.sashplatonov.habbit.runner.model.UserEntity;
import com.sashplatonov.habbit.runner.repository.AuthIdentityRepository;
import com.sashplatonov.habbit.runner.repository.UserRepository;
import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class IdentityServiceTest {
  @Test
  void resolvesExistingTelegramIdentity() {
    var identities = mock(AuthIdentityRepository.class);
    var users = mock(UserRepository.class);
    var identity = new AuthIdentityEntity();
    identity.setProvider(AuthProvider.TELEGRAM);
    identity.setProviderSubject("42");
    identity.setUserId("user-1");
    var user = new UserEntity();
    when(identities.findByProviderAndSubject(AuthProvider.TELEGRAM, "42")).thenReturn(identity);
    when(users.findRequiredById("user-1")).thenReturn(user);
    assertNotNull(new IdentityService(identities, users).findOrCreateTelegram("42"));
  }

  @Test
  void createsUserAndTelegramIdentityWhenMissing() {
    var identities = mock(AuthIdentityRepository.class);
    var users = mock(UserRepository.class);
    when(identities.findByProviderAndSubject(any(), any())).thenReturn(null);
    var result = new IdentityService(identities, users).findOrCreateTelegram("42");
    verify(users).save(any(UserEntity.class));
    verify(identities).save(any(AuthIdentityEntity.class));
    assertNotNull(result);
  }
}
