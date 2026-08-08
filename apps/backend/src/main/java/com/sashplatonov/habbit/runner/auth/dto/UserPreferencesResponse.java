package com.sashplatonov.habbit.runner.auth.dto;

public record UserPreferencesResponse(String theme, String timezone, DashboardPreferences dashboard) {
  public UserPreferencesResponse(String theme, String timezone) {
    this(theme, timezone, new DashboardPreferences());
  }
}
