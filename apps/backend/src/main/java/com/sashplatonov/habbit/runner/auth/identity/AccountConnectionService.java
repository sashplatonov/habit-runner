package com.sashplatonov.habbit.runner.auth.identity;

import com.sashplatonov.habbit.runner.auth.dto.AccountConnectionResponse;
import com.sashplatonov.habbit.runner.auth.dto.AccountConnectionsResponse;
import com.sashplatonov.habbit.runner.model.UserEntity;
import com.sashplatonov.habbit.runner.repository.AuthIdentityRepository;
import com.sashplatonov.habbit.runner.repository.UserRepository;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;
import jakarta.ws.rs.BadRequestException;
import jakarta.ws.rs.NotFoundException;
import jakarta.ws.rs.WebApplicationException;
import jakarta.ws.rs.core.Response;

@ApplicationScoped
public class AccountConnectionService {
  @Inject
  AuthIdentityRepository identityRepository;
  @Inject
  UserRepository userRepository;

  public AccountConnectionsResponse connections(String ownerUserId) {
    var user = requireUser(ownerUserId);
    var telegram = identityRepository.findByUserIdAndProvider(ownerUserId, AuthProvider.TELEGRAM);
    return new AccountConnectionsResponse(java.util.List.of(
        new AccountConnectionResponse("GOOGLE", user.getEmail() != null, user.getEmail()),
        new AccountConnectionResponse("TELEGRAM", telegram != null,
            telegram == null ? null : telegram.getDisplayName())));
  }

  @Transactional
  public void detach(String ownerUserId, String providerName) {
    var user = requireUser(ownerUserId);
    var provider = parseProvider(providerName);
    var hasGoogle = user.getEmail() != null;
    var hasTelegram = identityRepository.findByUserIdAndProvider(ownerUserId, AuthProvider.TELEGRAM) != null;
    if (!isConnected(provider, hasGoogle, hasTelegram)) {
      throw new NotFoundException("Account provider is not connected");
    }
    if (!hasAnotherProvider(provider, hasGoogle, hasTelegram)) {
      throw new WebApplicationException("At least one sign-in method must remain", Response.Status.CONFLICT);
    }
    if (provider == AuthProvider.GOOGLE) {
      user.setEmail(null);
    }
    identityRepository.deleteByUserIdAndProvider(ownerUserId, provider);
  }

  private UserEntity requireUser(String ownerUserId) {
    var user = userRepository.findRequiredById(ownerUserId);
    if (user == null) {
      throw new NotFoundException("Account not found");
    }
    return user;
  }

  private AuthProvider parseProvider(String providerName) {
    try {
      return AuthProvider.valueOf(providerName == null ? "" : providerName.trim().toUpperCase());
    } catch (IllegalArgumentException ex) {
      throw new BadRequestException("Unknown account provider", ex);
    }
  }

  private boolean isConnected(AuthProvider provider, boolean hasGoogle, boolean hasTelegram) {
    return provider == AuthProvider.GOOGLE ? hasGoogle : hasTelegram;
  }

  private boolean hasAnotherProvider(AuthProvider provider, boolean hasGoogle, boolean hasTelegram) {
    return provider == AuthProvider.GOOGLE ? hasTelegram : hasGoogle;
  }
}
