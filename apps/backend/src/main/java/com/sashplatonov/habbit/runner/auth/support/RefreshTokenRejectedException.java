package com.sashplatonov.habbit.runner.auth.support;

import jakarta.ws.rs.NotAuthorizedException;

public class RefreshTokenRejectedException extends NotAuthorizedException {
  public RefreshTokenRejectedException() {
    super("Refresh token expired or revoked");
  }
}
