package com.sashplatonov.habbit.runner.checkin.support;

import com.sashplatonov.habbit.runner.model.CheckinEntity;

import java.time.Instant;

public final class CheckinMutationSupport {
  private CheckinMutationSupport() {
  }

  public static void normalize(CheckinEntity checkin) {
    if (checkin.getCount() < 1) {
      checkin.setCount(1);
    }
    if (checkin.getVersion() < 1) {
      checkin.setVersion(1);
    }
  }

  public static void touch(CheckinEntity checkin) {
    checkin.setUpdatedAt(Instant.now());
    checkin.setVersion(Math.max(1, checkin.getVersion()) + 1);
  }
}
