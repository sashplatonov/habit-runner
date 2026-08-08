package com.sashplatonov.habbit.runner.auth.dto;

import jakarta.validation.constraints.NotBlank;

public record UpdatePreferencesRequest(
    @NotBlank String theme,
    String timezone,
    DashboardPreferences dashboard
) {
  public UpdatePreferencesRequest(String theme, String timezone) {
    this(theme, timezone, null);
  }
}
