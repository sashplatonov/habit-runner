package com.habittracker.auth;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

public final class AuthDtos {
  private AuthDtos() {
  }

  public record LoginRequest(@Email String email) {
  }

  public record RefreshRequest(@NotBlank String refreshToken) {
  }

  public record OAuthStartQuery(String returnTo) {
  }

  public record UpdateThemeRequest(@NotBlank String theme) {
  }

  public record UpdatePreferencesRequest(@NotBlank String theme, String timezone) {
  }

  public record TokenResponse(String accessToken, String refreshToken, int expiresIn, String tokenType) {
  }

  public record UserPreferencesResponse(String theme, String timezone) {
  }
}
