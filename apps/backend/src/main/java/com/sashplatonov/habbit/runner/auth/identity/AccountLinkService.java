package com.sashplatonov.habbit.runner.auth.identity;

import com.sashplatonov.habbit.runner.auth.telegram.TelegramInitDataVerifier;
import com.sashplatonov.habbit.runner.auth.telegram.TelegramWebAppUser;
import com.sashplatonov.habbit.runner.model.AccountLinkChallengeEntity;
import com.sashplatonov.habbit.runner.model.AuthIdentityEntity;
import com.sashplatonov.habbit.runner.repository.AccountLinkChallengeRepository;
import com.sashplatonov.habbit.runner.repository.AuthIdentityRepository;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.transaction.Transactional;
import jakarta.ws.rs.BadRequestException;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.Instant;
import java.util.HexFormat;
import java.util.UUID;

@ApplicationScoped
public class AccountLinkService {
  private final AccountLinkChallengeRepository challengeRepository;
  private final AuthIdentityRepository identityRepository;
  private final TelegramInitDataVerifier telegramVerifier;
  private final AccountMergeService mergeService;

  public AccountLinkService(AccountLinkChallengeRepository challengeRepository,
      AuthIdentityRepository identityRepository, TelegramInitDataVerifier telegramVerifier,
      AccountMergeService mergeService) {
    this.challengeRepository = challengeRepository;
    this.identityRepository = identityRepository;
    this.telegramVerifier = telegramVerifier;
    this.mergeService = mergeService;
  }

  @Transactional
  public String startTelegramLink(String ownerUserId) {
    var token = UUID.randomUUID().toString() + UUID.randomUUID();
    var challenge = new AccountLinkChallengeEntity();
    challenge.setOwnerUserId(ownerUserId);
    challenge.setTokenHash(hash(token));
    challenge.setStatus("PENDING");
    challenge.setExpiresAt(Instant.now().plusSeconds(600));
    challengeRepository.save(challenge);
    return token;
  }

  @Transactional
  public void completeTelegramLink(String ownerUserId, String token, String initData) {
    var challenge = requireChallenge(ownerUserId, token);
    if (!"PENDING".equals(challenge.getStatus())) {
      throw new BadRequestException("Account link challenge is not pending");
    }
    TelegramWebAppUser telegramUser = telegramVerifier.verify(initData);
    var existing = identityRepository.findByProviderAndSubject(AuthProvider.TELEGRAM, Long.toString(telegramUser.id()));
    linkIdentity(challenge, existing, telegramUser);
    challenge.setTelegramUserId(Long.toString(telegramUser.id()));
    challenge.setTelegramUsername(telegramUser.username());
  }

  private void linkIdentity(AccountLinkChallengeEntity challenge, AuthIdentityEntity existing,
      TelegramWebAppUser telegramUser) {
    if (existing != null && !challenge.getOwnerUserId().equals(existing.getUserId())) {
      challenge.setStatus("AWAITING_OWNER_CONFIRMATION");
      return;
    }
    if (existing == null) {
      var identity = new AuthIdentityEntity();
      identity.setProvider(AuthProvider.TELEGRAM);
      identity.setProviderSubject(Long.toString(telegramUser.id()));
      identity.setUserId(challenge.getOwnerUserId());
      identityRepository.save(identity);
    }
    challenge.setStatus("COMPLETED");
  }

  @Transactional
  public void confirmTelegramLink(String ownerUserId, String token) {
    var challenge = requireChallenge(ownerUserId, token);
    if (!"AWAITING_OWNER_CONFIRMATION".equals(challenge.getStatus())) {
      throw new BadRequestException("Account link challenge is not awaiting confirmation");
    }
    var identity = identityRepository.findByProviderAndSubject(
        AuthProvider.TELEGRAM, challenge.getTelegramUserId());
    if (identity == null || ownerUserId.equals(identity.getUserId())) {
      throw new BadRequestException("Telegram identity proof is missing");
    }
    mergeService.merge(ownerUserId, identity.getUserId());
    challenge.setStatus("COMPLETED");
  }

  public String status(String ownerUserId, String token) {
    return requireChallenge(ownerUserId, token).getStatus();
  }

  @Transactional
  public void cancel(String ownerUserId, String token) {
    var challenge = requireChallenge(ownerUserId, token);
    if ("PENDING".equals(challenge.getStatus()) || "AWAITING_OWNER_CONFIRMATION".equals(challenge.getStatus())) {
      challenge.setStatus("CANCELLED");
    }
  }

  private AccountLinkChallengeEntity requireChallenge(String ownerUserId, String token) {
    if (ownerUserId == null || token == null || token.isBlank()) {
      throw new BadRequestException("Invalid account link challenge");
    }
    var challenge = challengeRepository.findByTokenHash(hash(token));
    if (challenge == null || !ownerUserId.equals(challenge.getOwnerUserId())) {
      throw new BadRequestException("Invalid or expired account link challenge");
    }
    ensureUsable(challenge);
    return challenge;
  }

  private void ensureUsable(AccountLinkChallengeEntity challenge) {
    if (challenge.isExpiredAt(Instant.now()) || "CANCELLED".equals(challenge.getStatus())) {
      throw new BadRequestException("Invalid or expired account link challenge");
    }
  }

  private String hash(String value) {
    try {
      return HexFormat.of().formatHex(MessageDigest.getInstance("SHA-256")
          .digest(value.getBytes(StandardCharsets.UTF_8)));
    } catch (java.security.NoSuchAlgorithmException ex) {
      throw new IllegalStateException("Unable to hash link token", ex);
    }
  }
}
