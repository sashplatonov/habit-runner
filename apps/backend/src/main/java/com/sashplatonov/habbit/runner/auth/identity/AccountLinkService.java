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
  private final AccountLinkChallengeRepository challengeRepository;
  private final AuthIdentityRepository identityRepository;
  private final TelegramInitDataVerifier telegramVerifier;
  private final AccountMergeService mergeService;

  @jakarta.inject.Inject
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
  public String completeTelegramLink(String token, String initData) {
    var challenge = requireChallengeForCompletion(token);
    if (!"PENDING".equals(challenge.getStatus())) {
      throw new BadRequestException("Account link challenge is not pending");
    }
    TelegramWebAppUser telegramUser = telegramVerifier.verify(initData);
    var existing = identityRepository.findByProviderAndSubject(AuthProvider.TELEGRAM, Long.toString(telegramUser.id()));
    ensureOwnerCanLinkTelegramIdentity(challenge.getOwnerUserId(), existing);
    challenge.setTelegramUserId(Long.toString(telegramUser.id()));
    challenge.setTelegramUsername(telegramUser.username());
    var displayName = telegramUser.username() == null || telegramUser.username().isBlank()
        ? null : "@" + telegramUser.username();
    linkTelegramIdentity(challenge.getOwnerUserId(), telegramUser.id(), displayName, existing);
    challenge.setStatus("COMPLETED");
    log.info("event=telegram_link_challenge_verified tokenRef={} telegramUserRef={} status={} existingIdentity={}",
        tokenReference(token), fingerprint(Long.toString(telegramUser.id())), challenge.getStatus(), existing != null);
    return challenge.getOwnerUserId();
  }

  private void ensureOwnerCanLinkTelegramIdentity(String ownerUserId, AuthIdentityEntity incomingIdentity) {
    var ownerTelegramIdentity = identityRepository.findByUserIdAndProvider(ownerUserId, AuthProvider.TELEGRAM);
    if (ownerTelegramIdentity != null && (incomingIdentity == null
        || !ownerTelegramIdentity.getProviderSubject().equals(incomingIdentity.getProviderSubject()))) {
      throw new jakarta.ws.rs.ClientErrorException(
          "A different Telegram account is already linked", jakarta.ws.rs.core.Response.Status.CONFLICT);
    }
  }

  private void linkTelegramIdentity(String ownerUserId, long telegramUserId, String displayName,
      AuthIdentityEntity existing) {
    if (existing == null) {
      var identity = new AuthIdentityEntity();
      identity.setProvider(AuthProvider.TELEGRAM);
      identity.setProviderSubject(Long.toString(telegramUserId));
      identity.setUserId(ownerUserId);
      identity.setDisplayName(displayName);
      identityRepository.save(identity);
    } else {
      if (!ownerUserId.equals(existing.getUserId())) {
        mergeService.merge(ownerUserId, existing.getUserId());
      }
      existing.setDisplayName(displayName);
    }
  }

  public boolean isTelegramLinked(String ownerUserId) {
    return identityRepository.findByUserIdAndProvider(ownerUserId, AuthProvider.TELEGRAM) != null;
  }

  private AccountLinkChallengeEntity requireChallengeForCompletion(String token) {
    if (token == null || token.isBlank()) {
      throw new BadRequestException("Invalid account link challenge");
    }
    var tokenHash = hash(token);
    var challenge = challengeRepository.findByTokenHashForUpdate(tokenHash);
    if (challenge == null) {
      log.warn("event=telegram_link_challenge_rejected reason=not_found tokenRef={}", tokenReferenceFromHash(tokenHash));
      throw new BadRequestException("Invalid or expired account link challenge");
    }
    ensureUsable(challenge, tokenHash);
    return challenge;
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
