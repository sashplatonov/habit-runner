package com.sashplatonov.habbit.runner.auth.access;

import com.sashplatonov.habbit.runner.model.OAuthStateEntity;
import com.sashplatonov.habbit.runner.model.UserEntity;
import com.sashplatonov.habbit.runner.repository.OAuthStateRepository;
import com.sashplatonov.habbit.runner.repository.UserRepository;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertSame;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class RepositoryAccessTest {
  @Test
  void shouldDelegateUserAccessToRepository() {
    var userRepository = mock(UserRepository.class);
    var userAccess = new RepositoryUserAccess(userRepository);
    var user = new UserEntity();
    when(userRepository.findByEmail("user@example.test")).thenReturn(user);
    when(userRepository.findRequiredById("user-1")).thenReturn(user);

    assertSame(user, userAccess.findByEmail("user@example.test"));
    assertSame(user, userAccess.findRequiredById("user-1"));
    verify(userRepository).findByEmail("user@example.test");
    verify(userRepository).findRequiredById("user-1");
  }

  @Test
  void shouldConsumeAndSaveOAuthStateThroughRepository() {
    var oauthStateRepository = mock(OAuthStateRepository.class);
    var oauthStateAccess = new RepositoryOAuthStateAccess(oauthStateRepository);
    var state = new OAuthStateEntity();
    state.state = "state-1";
    when(oauthStateRepository.findById("state-1")).thenReturn(state);

    assertEquals(state, oauthStateAccess.consume("state-1"));

    oauthStateAccess.save(state);

    verify(oauthStateRepository).deleteState("state-1");
    verify(oauthStateRepository).save(state);
  }
}
