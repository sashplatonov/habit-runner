package com.sashplatonov.habbit.runner.auth.identity;

import com.sashplatonov.habbit.runner.auth.identity.AccountLinkService;
import com.sashplatonov.habbit.runner.auth.identity.AccountMergeService;
import com.sashplatonov.habbit.runner.auth.telegram.TelegramInitDataVerifier;
import com.sashplatonov.habbit.runner.auth.telegram.TelegramWebAppUser;
import com.sashplatonov.habbit.runner.auth.identity.AuthProvider;
import com.sashplatonov.habbit.runner.model.AccountLinkChallengeEntity;
import com.sashplatonov.habbit.runner.model.AuthIdentityEntity;
import com.sashplatonov.habbit.runner.repository.AccountLinkChallengeRepository;
import com.sashplatonov.habbit.runner.repository.AuthIdentityRepository;
import jakarta.ws.rs.BadRequestException;
import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class AccountLinkServiceTest {
  @Test
  void createsChallengeAndStoresOnlyHash() {
    var challenges = mock(AccountLinkChallengeRepository.class);
    var service = new AccountLinkService(challenges, mock(AuthIdentityRepository.class),
        mock(TelegramInitDataVerifier.class), mock(AccountMergeService.class));
    var token = service.startTelegramLink("user-1");
    verify(challenges).save(any());
    assertThrows(BadRequestException.class, () -> service.status("user-2", token));
  }

  @Test
  void completesNewTelegramIdentityAndCanCancelChallenge() {
    var challenges = mock(AccountLinkChallengeRepository.class);
    var identities = mock(AuthIdentityRepository.class);
    var verifier = mock(TelegramInitDataVerifier.class);
    var service = new AccountLinkService(challenges, identities, verifier, mock(AccountMergeService.class));
    var challenge = challenge("user-1", "PENDING");
    when(challenges.findByTokenHash(any())).thenReturn(challenge);
    when(verifier.verify("signed")).thenReturn(new TelegramWebAppUser(42, "alice", null, null));
    service.completeTelegramLink("user-1", "token", "signed");
    verify(identities).save(any());
    service.cancel("user-1", "token");
    verify(challenges, org.mockito.Mockito.times(2)).findByTokenHash(any());
  }

  @Test
  void confirmsExistingIdentityOnlyAfterOwnerConfirmation() {
    var challenges = mock(AccountLinkChallengeRepository.class);
    var identities = mock(AuthIdentityRepository.class);
    var merge = mock(AccountMergeService.class);
    var service = new AccountLinkService(challenges, identities, mock(TelegramInitDataVerifier.class), merge);
    var challenge = challenge("owner", "AWAITING_OWNER_CONFIRMATION");
    challenge.setTelegramUserId("42");
    var identity = new AuthIdentityEntity();
    identity.setProvider(AuthProvider.TELEGRAM);
    identity.setProviderSubject("42");
    identity.setUserId("absorbed");
    when(challenges.findByTokenHash(any())).thenReturn(challenge);
    when(identities.findByProviderAndSubject(AuthProvider.TELEGRAM, "42")).thenReturn(identity);
    service.confirmTelegramLink("owner", "token");
    verify(merge).merge("owner", "absorbed");
  }

  @Test
  void defersMergeUntilOwnerConfirmationWhenTelegramBelongsElsewhere() {
    var challenges = mock(AccountLinkChallengeRepository.class);
    var identities = mock(AuthIdentityRepository.class);
    var verifier = mock(TelegramInitDataVerifier.class);
    var service = new AccountLinkService(challenges, identities, verifier, mock(AccountMergeService.class));
    var challenge = challenge("owner", "PENDING");
    var identity = new AuthIdentityEntity();
    identity.setUserId("other");
    when(challenges.findByTokenHash(any())).thenReturn(challenge);
    when(verifier.verify("signed")).thenReturn(new TelegramWebAppUser(7, "seven", null, null));
    when(identities.findByProviderAndSubject(AuthProvider.TELEGRAM, "7")).thenReturn(identity);
    service.completeTelegramLink("owner", "token", "signed");
    verify(identities, org.mockito.Mockito.never()).save(any());
  }

  private AccountLinkChallengeEntity challenge(String owner, String status) {
    var challenge = new AccountLinkChallengeEntity();
    challenge.setOwnerUserId(owner);
    challenge.setStatus(status);
    challenge.setExpiresAt(java.time.Instant.now().plusSeconds(60));
    return challenge;
  }
}
