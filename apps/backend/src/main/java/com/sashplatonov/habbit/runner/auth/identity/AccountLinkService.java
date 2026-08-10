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
import lombok.extern.slf4j.Slf4j;

@ApplicationScoped
@Slf4j
public class AccountLinkService {
  private static final int TOKEN_REFERENCE_LENGTH = 12;
  @jakarta.inject.Inject
  AccountLinkChallengeRepository challengeRepository;
  @jakarta.inject.Inject
  AuthIdentityRepository identityRepository;
  @jakarta.inject.Inject
  TelegramInitDataVerifier telegramVerifier;
  @jakarta.inject.Inject
  AccountMergeService mergeService;

  AccountLinkService(AccountLinkChallengeRepository challengeRepository,
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
    log.info("event=telegram_link_challenge_started tokenRef={} ownerRef={} expiresAt={}",
        tokenReference(token), fingerprint(ownerUserId), challenge.getExpiresAt());
    return token;
  }

  @Transactional
  public void completeTelegramLink(String token, String initData) {
    var challenge = requireChallenge(token);
    if (!"PENDING".equals(challenge.getStatus())) {
      throw new BadRequestException("Account link challenge is not pending");
    }
    TelegramWebAppUser telegramUser = telegramVerifier.verify(initData);
    var existing = identityRepository.findByProviderAndSubject(AuthProvider.TELEGRAM, Long.toString(telegramUser.id()));
    challenge.setTelegramUserId(Long.toString(telegramUser.id()));
    challenge.setTelegramUsername(telegramUser.username());
    if (existing != null && challenge.getOwnerUserId().equals(existing.getUserId())) {
      challenge.setStatus("COMPLETED");
    } else {
      challenge.setStatus("AWAITING_OWNER_CONFIRMATION");
    }
    log.info("event=telegram_link_challenge_verified tokenRef={} telegramUserRef={} status={} existingIdentity={}",
        tokenReference(token), fingerprint(Long.toString(telegramUser.id())), challenge.getStatus(), existing != null);
  }

  @Transactional
  public void confirmTelegramLink(String ownerUserId, String token) {
    var challenge = requireChallenge(ownerUserId, token);
    if (!"AWAITING_OWNER_CONFIRMATION".equals(challenge.getStatus())) {
      throw new BadRequestException("Account link challenge is not awaiting confirmation");
    }
    var identity = identityRepository.findByProviderAndSubject(
        AuthProvider.TELEGRAM, challenge.getTelegramUserId());
    if (identity == null) {
      var newIdentity = new AuthIdentityEntity();
      newIdentity.setProvider(AuthProvider.TELEGRAM);
      newIdentity.setProviderSubject(challenge.getTelegramUserId());
      newIdentity.setUserId(ownerUserId);
      identityRepository.save(newIdentity);
    } else if (!ownerUserId.equals(identity.getUserId())) {
      mergeService.merge(ownerUserId, identity.getUserId());
    }
    challenge.setStatus("COMPLETED");
  }

  public String status(String ownerUserId, String token) {
    return requireChallenge(ownerUserId, token).getStatus();
  }

  public boolean isTelegramLinked(String ownerUserId) {
    return identityRepository.findByUserIdAndProvider(ownerUserId, AuthProvider.TELEGRAM) != null;
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
    var tokenHash = hash(token);
    var challenge = challengeRepository.findByTokenHash(tokenHash);
    validateOwner(challenge, ownerUserId, tokenHash);
    ensureUsable(challenge, tokenHash);
    return challenge;
  }

  private AccountLinkChallengeEntity requireChallenge(String token) {
    if (token == null || token.isBlank()) {
      throw new BadRequestException("Invalid account link challenge");
    }
    var tokenHash = hash(token);
    var challenge = challengeRepository.findByTokenHash(tokenHash);
    if (challenge == null) {
      log.warn("event=telegram_link_challenge_rejected reason=not_found tokenRef={}", tokenReferenceFromHash(tokenHash));
      throw new BadRequestException("Invalid or expired account link challenge");
    }
    ensureUsable(challenge, tokenHash);
    return challenge;
  }

  private void validateOwner(AccountLinkChallengeEntity challenge, String ownerUserId, String tokenHash) {
    if (challenge == null || !ownerUserId.equals(challenge.getOwnerUserId())) {
      log.warn("event=telegram_link_challenge_rejected reason=owner_mismatch tokenRef={} ownerRef={} storedOwnerRef={}",
          tokenReferenceFromHash(tokenHash), fingerprint(ownerUserId),
          challenge == null ? "absent" : fingerprint(challenge.getOwnerUserId()));
      throw new BadRequestException("Invalid or expired account link challenge");
    }
  }

  private void ensureUsable(AccountLinkChallengeEntity challenge, String tokenHash) {
    var expired = challenge.isExpiredAt(Instant.now());
    if (expired || "CANCELLED".equals(challenge.getStatus())) {
      log.warn("event=telegram_link_challenge_rejected reason={} tokenRef={} status={} expiresAt={}",
          expired ? "expired" : "cancelled", tokenReferenceFromHash(tokenHash),
          challenge.getStatus(), challenge.getExpiresAt());
      throw new BadRequestException("Invalid or expired account link challenge");
    }
  }

  private String tokenReference(String token) {
    return tokenReferenceFromHash(hash(token));
  }

  private String tokenReferenceFromHash(String tokenHash) {
    return tokenHash.substring(0, TOKEN_REFERENCE_LENGTH);
  }

  private String fingerprint(String value) {
    return hash(value).substring(0, TOKEN_REFERENCE_LENGTH);
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
