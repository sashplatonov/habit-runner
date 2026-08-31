package com.sashplatonov.habbit.runner.auth.service;

import com.sashplatonov.habbit.runner.auth.support.AuthRateLimitService;
import com.sashplatonov.habbit.runner.model.UserEntity;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.Mockito.mock;

class OAuthAccountLinkServiceTest {

  private OAuthAccountLinkService linkService(StubUserService userService) {
    return new OAuthAccountLinkService(userService, mock(
        com.sashplatonov.habbit.runner.auth.identity.AccountMergeService.class),
        new AuthRateLimitService());
  }

  private UserEntity user(String id, String email) {
    var user = new UserEntity();
    user.setId(id);
    user.setEmail(email);
    return user;
  }

  @Test
  void shouldKeepExistingUserWhenGoogleLinkAlreadyPointsToThatUser() {
    var userService = new StubUserService();
    var user = user("same-user", "old@example.test");
    userService.setUserById(user);
    var service = linkService(userService);

    var resolved = service.resolve(user, "new@example.test", "same-user");

    assertEquals(user, resolved);
    assertEquals("new@example.test", user.getEmail());
  }

  @Test
  void shouldReturnGoogleUserWhenNoLinkIntentExists() {
    var user = user("google-user", "oauth@example.test");
    var service = linkService(new StubUserService());

    assertEquals(user, service.resolve(user, user.getEmail(), null));
  }
}
