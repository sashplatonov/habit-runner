package com.sashplatonov.habbit.runner.auth.service;

import com.sashplatonov.habbit.runner.auth.identity.AccountMergeService;

final class RecordingAccountMergeService extends AccountMergeService {
  private String survivor;
  private String absorbed;

  @Override
  public void merge(String survivorUserId, String absorbedUserId) {
    survivor = survivorUserId;
    absorbed = absorbedUserId;
  }

  String survivor() {
    return survivor;
  }

  String absorbed() {
    return absorbed;
  }
}
