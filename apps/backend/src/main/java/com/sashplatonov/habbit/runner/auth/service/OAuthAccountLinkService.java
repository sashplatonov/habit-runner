package com.sashplatonov.habbit.runner.auth.service;

import com.sashplatonov.habbit.runner.auth.identity.AccountMergeService;
import com.sashplatonov.habbit.runner.auth.support.AuthRateLimitService;
import com.sashplatonov.habbit.runner.model.UserEntity;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.ws.rs.NotAuthorizedException;

import java.time.Duration;

@ApplicationScoped
public class OAuthAccountLinkService {
  final UserService userService;
  final AccountMergeService accountMergeService;
  final AuthRateLimitService authRateLimitService;

  @Inject
  OAuthAccountLinkService(
      UserService userService,
      AccountMergeService accountMergeService,
      AuthRateLimitService authRateLimitService
  ) {
    this.userService = userService;
    this.accountMergeService = accountMergeService;
    this.authRateLimitService = authRateLimitService;
  }

  public UserEntity resolveOrCreate(String email, String ownerId) {
    authRateLimitService.checkAccount("auth:google:callback", email, 10, Duration.ofMinutes(10));
    var googleUser = userService.findOrCreateUser(email);
    return resolve(googleUser, email, ownerId);
  }

  public UserEntity resolve(UserEntity googleUser, String email, String ownerId) {
    if (ownerId == null) {
      return googleUser;
    }
    var owner = userService.findRequiredUserById(ownerId);
    if (owner == null) {
      throw new NotAuthorizedException("Linking account no longer exists");
    }
    if (!owner.getId().equals(googleUser.getId())) {
      accountMergeService.merge(owner.getId(), googleUser.getId());
    }
    owner.setEmail(email);
    return owner;
  }
}
