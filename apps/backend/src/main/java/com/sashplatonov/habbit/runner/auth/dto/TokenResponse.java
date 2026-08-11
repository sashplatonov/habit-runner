package com.sashplatonov.habbit.runner.auth.dto;

public record TokenResponse(String accessToken, String refreshToken, int expiresIn, String tokenType,
                            boolean existingAccount) {
  public TokenResponse(String accessToken, String refreshToken, int expiresIn, String tokenType) {
    this(accessToken, refreshToken, expiresIn, tokenType, false);
  }
}
