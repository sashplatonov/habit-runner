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
import jakarta.ws.rs.ClientErrorException;
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
  }

  @Test
  void linksNewTelegramIdentityImmediatelyAfterVerification() {
    var challenges = mock(AccountLinkChallengeRepository.class);
    var identities = mock(AuthIdentityRepository.class);
    var verifier = mock(TelegramInitDataVerifier.class);
    var service = new AccountLinkService(challenges, identities, verifier, mock(AccountMergeService.class));
    var challenge = challenge("user-1", "PENDING");
    when(challenges.findByTokenHashForUpdate(any())).thenReturn(challenge);
    when(verifier.verify("signed")).thenReturn(new TelegramWebAppUser(42, "alice", null, null));
    service.completeTelegramLink("token", "signed");
    verify(identities).save(any());
    org.junit.jupiter.api.Assertions.assertEquals("COMPLETED", challenge.getStatus());
  }

  @Test
  void mergesExistingTelegramIdentityImmediatelyAfterVerification() {
    var challenges = mock(AccountLinkChallengeRepository.class);
    var identities = mock(AuthIdentityRepository.class);
    var merge = mock(AccountMergeService.class);
    var verifier = mock(TelegramInitDataVerifier.class);
    var service = new AccountLinkService(challenges, identities, verifier, merge);
    var challenge = challenge("owner", "PENDING");
    var identity = new AuthIdentityEntity();
    identity.setProvider(AuthProvider.TELEGRAM);
    identity.setProviderSubject("42");
    identity.setUserId("absorbed");
    when(challenges.findByTokenHashForUpdate(any())).thenReturn(challenge);
    when(identities.findByProviderAndSubject(AuthProvider.TELEGRAM, "42")).thenReturn(identity);
    when(verifier.verify("signed")).thenReturn(new TelegramWebAppUser(42, "updated", null, null));
    service.completeTelegramLink("token", "signed");
    verify(merge).merge("owner", "absorbed");
    org.junit.jupiter.api.Assertions.assertEquals("COMPLETED", challenge.getStatus());
  }

  @Test
  void mergesTelegramIdentityBelongingToAnotherAccountImmediately() {
    var challenges = mock(AccountLinkChallengeRepository.class);
    var identities = mock(AuthIdentityRepository.class);
    var verifier = mock(TelegramInitDataVerifier.class);
    var merge = mock(AccountMergeService.class);
    var service = new AccountLinkService(challenges, identities, verifier, merge);
    var challenge = challenge("owner", "PENDING");
    var identity = new AuthIdentityEntity();
    identity.setUserId("other");
    when(challenges.findByTokenHashForUpdate(any())).thenReturn(challenge);
    when(verifier.verify("signed")).thenReturn(new TelegramWebAppUser(7, "seven", null, null));
    when(identities.findByProviderAndSubject(AuthProvider.TELEGRAM, "7")).thenReturn(identity);
    service.completeTelegramLink("token", "signed");
    verify(merge).merge("owner", "other");
  }

  @Test
  void reportsWhetherTheAuthenticatedOwnerHasATelegramIdentity() {
    var identities = mock(AuthIdentityRepository.class);
    var service = new AccountLinkService(mock(AccountLinkChallengeRepository.class), identities,
        mock(TelegramInitDataVerifier.class), mock(AccountMergeService.class));
    when(identities.findByUserIdAndProvider("owner", AuthProvider.TELEGRAM))
        .thenReturn(new AuthIdentityEntity());

    org.junit.jupiter.api.Assertions.assertTrue(service.isTelegramLinked("owner"));
    org.junit.jupiter.api.Assertions.assertFalse(service.isTelegramLinked("other"));
  }

  @Test
  void rejectsLinkingAnotherTelegramAccountWhenTheOwnerAlreadyHasOne() {
    var challenges = mock(AccountLinkChallengeRepository.class);
    var identities = mock(AuthIdentityRepository.class);
    var verifier = mock(TelegramInitDataVerifier.class);
    var service = new AccountLinkService(challenges, identities, verifier, mock(AccountMergeService.class));
    var challenge = challenge("owner", "PENDING");
    var ownerIdentity = new AuthIdentityEntity();
    ownerIdentity.setProviderSubject("42");
    when(challenges.findByTokenHashForUpdate(any())).thenReturn(challenge);
    when(verifier.verify("signed")).thenReturn(new TelegramWebAppUser(7, "seven", null, null));
    when(identities.findByUserIdAndProvider("owner", AuthProvider.TELEGRAM)).thenReturn(ownerIdentity);

    var exception = assertThrows(ClientErrorException.class,
        () -> service.completeTelegramLink("token", "signed"));

    org.junit.jupiter.api.Assertions.assertEquals(409, exception.getResponse().getStatus());
  }

  private AccountLinkChallengeEntity challenge(String owner, String status) {
    var challenge = new AccountLinkChallengeEntity();
    challenge.setOwnerUserId(owner);
    challenge.setStatus(status);
    challenge.setExpiresAt(java.time.Instant.now().plusSeconds(60));
    return challenge;
  }
}
