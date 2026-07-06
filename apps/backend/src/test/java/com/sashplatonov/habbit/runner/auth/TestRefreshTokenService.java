package com.sashplatonov.habbit.runner.auth;

import com.sashplatonov.habbit.runner.model.RefreshTokenEntity;

import java.time.Instant;

final class TestRefreshTokenService extends RefreshTokenService {
  private RefreshTokenEntity recordByToken;
  private RefreshTokenEntity persistedRecord;
  private Instant currentTime = Instant.parse("2026-04-10T14:00:00Z");

  void setRecordByToken(RefreshTokenEntity recordByToken) {
    this.recordByToken = recordByToken;
  }

  RefreshTokenEntity getRecordByToken() {
    return recordByToken;
  }

  RefreshTokenEntity getPersistedRecord() {
    return persistedRecord;
  }

  void setCurrentTime(Instant currentTime) {
    this.currentTime = currentTime;
  }

  @Override
  protected RefreshTokenEntity findByToken(String token) {
    return recordByToken;
  }

  @Override
  protected RefreshTokenEntity newRefreshToken() {
    return new RefreshTokenEntity();
  }

  @Override
  protected void persistRefreshToken(RefreshTokenEntity refresh) {
    persistedRecord = refresh;
  }

  @Override
  protected Instant now() {
    return currentTime;
  }
}
