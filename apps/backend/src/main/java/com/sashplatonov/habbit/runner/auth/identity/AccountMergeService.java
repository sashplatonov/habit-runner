package com.sashplatonov.habbit.runner.auth.identity;

import jakarta.enterprise.context.ApplicationScoped;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import jakarta.transaction.Transactional;

@ApplicationScoped
public class AccountMergeService {
  @PersistenceContext
  EntityManager entityManager;

  @Transactional
  public void merge(String survivorUserId, String absorbedUserId) {
    if (survivorUserId == null || survivorUserId.isBlank()
        || absorbedUserId == null || absorbedUserId.isBlank()
        || survivorUserId.equals(absorbedUserId)) {
      throw new IllegalArgumentException("Two distinct user IDs are required for an account merge");
    }

    deleteDuplicatePushSubscriptions(survivorUserId, absorbedUserId);
    transferOwnedRows("habits", survivorUserId, absorbedUserId);
    transferOwnedRows("checkins", survivorUserId, absorbedUserId);
    transferOwnedRows("auth_identities", survivorUserId, absorbedUserId);
    revokeAndTransferRefreshTokens(survivorUserId, absorbedUserId);
    transferOwnedRows("push_subscriptions", survivorUserId, absorbedUserId);
    deleteUser(absorbedUserId);
  }

  private void deleteDuplicatePushSubscriptions(String survivorUserId, String absorbedUserId) {
    entityManager.createNativeQuery(
        "DELETE FROM push_subscriptions absorbed "
            + "WHERE absorbed.\"userId\" = :absorbed "
            + "AND EXISTS (SELECT 1 FROM push_subscriptions survivor "
            + "WHERE survivor.endpoint = absorbed.endpoint AND survivor.\"userId\" = :survivor)"
    ).setParameter("survivor", survivorUserId)
        .setParameter("absorbed", absorbedUserId)
        .executeUpdate();
  }

  private void transferOwnedRows(String table, String survivorUserId, String absorbedUserId) {
    entityManager.createNativeQuery(
        "UPDATE " + table + " SET \"userId\" = :survivor WHERE \"userId\" = :absorbed"
    ).setParameter("survivor", survivorUserId)
        .setParameter("absorbed", absorbedUserId)
        .executeUpdate();
  }

  private void revokeAndTransferRefreshTokens(String survivorUserId, String absorbedUserId) {
    entityManager.createNativeQuery(
        "UPDATE refresh_tokens SET \"userId\" = :survivor, revoked = TRUE WHERE \"userId\" = :absorbed"
    ).setParameter("survivor", survivorUserId)
        .setParameter("absorbed", absorbedUserId)
        .executeUpdate();
  }

  private void deleteUser(String absorbedUserId) {
    entityManager.createNativeQuery("DELETE FROM users WHERE id = :absorbed")
        .setParameter("absorbed", absorbedUserId)
        .executeUpdate();
  }
}
