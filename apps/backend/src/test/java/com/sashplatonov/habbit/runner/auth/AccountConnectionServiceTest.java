package com.sashplatonov.habbit.runner.auth.identity;

import com.sashplatonov.habbit.runner.model.AuthIdentityEntity;
import com.sashplatonov.habbit.runner.model.UserEntity;
import com.sashplatonov.habbit.runner.repository.AuthIdentityRepository;
import com.sashplatonov.habbit.runner.repository.UserRepository;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class AccountConnectionServiceTest {
  @Test
  void returnsDetailsAndDetachesEitherProviderWhenAnotherRemains() {
    var identities = mock(AuthIdentityRepository.class);
    var users = mock(UserRepository.class);
    var service = new AccountConnectionService();
    service.identityRepository = identities;
    service.userRepository = users;
    var user = new UserEntity();
    user.setEmail("owner@example.test");
    var telegram = new AuthIdentityEntity();
    telegram.setDisplayName("@owner");
    when(users.findRequiredById("owner")).thenReturn(user);
    when(users.findRequiredByIdForUpdate("owner")).thenReturn(user);
    when(identities.findByUserIdAndProvider("owner", AuthProvider.TELEGRAM)).thenReturn(telegram);

    var response = service.connections("owner");

    assertTrue(response.connections().get(0).connected());
    assertEquals("owner@example.test", response.connections().get(0).displayName());
    assertEquals("@owner", response.connections().get(1).displayName());
    service.detach("owner", "telegram");
    verify(identities).deleteByUserIdAndProvider("owner", AuthProvider.TELEGRAM);
    service.detach("owner", "google");
    assertNull(user.getEmail());
    verify(identities).deleteByUserIdAndProvider("owner", AuthProvider.GOOGLE);
    verify(users, org.mockito.Mockito.times(2)).findRequiredByIdForUpdate("owner");
  }

  @Test
  void rejectsDetachingTheLastSignInMethod() {
    var identities = mock(AuthIdentityRepository.class);
    var users = mock(UserRepository.class);
    var service = new AccountConnectionService();
    service.identityRepository = identities;
    service.userRepository = users;
    var user = new UserEntity();
    user.setEmail("owner@example.test");
    when(users.findRequiredById("owner")).thenReturn(user);
    when(users.findRequiredByIdForUpdate("owner")).thenReturn(user);
    when(identities.findByUserIdAndProvider("owner", AuthProvider.TELEGRAM)).thenReturn(null);

    var error = assertThrows(jakarta.ws.rs.WebApplicationException.class,
        () -> service.detach("owner", "google"));

    assertEquals(409, error.getResponse().getStatus());
    verify(identities, never()).deleteByUserIdAndProvider(any(), any());
  }
}
