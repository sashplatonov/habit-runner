package com.sashplatonov.habbit.runner.auth.support;

public class RefreshTokenRotationConflictException extends RuntimeException {
  public RefreshTokenRotationConflictException() {
    super("Refresh token rotation already completed");
  }
}
