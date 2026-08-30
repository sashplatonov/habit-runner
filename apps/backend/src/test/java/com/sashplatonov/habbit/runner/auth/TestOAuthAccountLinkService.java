package com.sashplatonov.habbit.runner.auth;

import com.sashplatonov.habbit.runner.auth.identity.AccountMergeService;
import com.sashplatonov.habbit.runner.auth.service.OAuthAccountLinkService;
import com.sashplatonov.habbit.runner.auth.service.UserService;
import java.lang.reflect.Field;

final class TestOAuthAccountLinkService extends OAuthAccountLinkService {
  TestOAuthAccountLinkService(UserService userService, AccountMergeService mergeService) {
    super(userService);
    try {
      Field field = OAuthAccountLinkService.class.getDeclaredField("accountMergeService");
      field.setAccessible(true);
      field.set(this, mergeService);
    } catch (ReflectiveOperationException exception) {
      throw new AssertionError(exception);
    }
  }
}
