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
  public void completeTelegramLink(String token, String initData) {
    var challenge = challengeRepository.findByTokenHash(hash(token));
    if (challenge == null || !"PENDING".equals(challenge.getStatus()) || challenge.isExpiredAt(Instant.now())) {
      throw new BadRequestException("Invalid or expired account link challenge");
    }
    TelegramWebAppUser telegramUser = telegramVerifier.verify(initData);
    var existing = identityRepository.findByProviderAndSubject(AuthProvider.TELEGRAM, Long.toString(telegramUser.id()));
    if (existing != null && !challenge.getOwnerUserId().equals(existing.getUserId())) {
      mergeService.merge(challenge.getOwnerUserId(), existing.getUserId());
    } else if (existing == null) {
      var identity = new AuthIdentityEntity();
      identity.setProvider(AuthProvider.TELEGRAM);
      identity.setProviderSubject(Long.toString(telegramUser.id()));
      identity.setUserId(challenge.getOwnerUserId());
      identity.setEmail(null);
      identityRepository.save(identity);
    }
    challenge.setTelegramUserId(Long.toString(telegramUser.id()));
    challenge.setTelegramUsername(telegramUser.username());
    challenge.setStatus("COMPLETED");
  }

  private String hash(String value) {
    try {
      return HexFormat.of().formatHex(MessageDigest.getInstance("SHA-256")
          .digest(value.getBytes(StandardCharsets.UTF_8)));
    } catch (Exception ex) {
      throw new IllegalStateException("Unable to hash link token", ex);
    }
  }
}
