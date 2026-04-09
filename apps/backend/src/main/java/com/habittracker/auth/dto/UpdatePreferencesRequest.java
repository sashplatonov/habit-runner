package com.habittracker.auth.dto;

import jakarta.validation.constraints.NotBlank;

public record UpdatePreferencesRequest(@NotBlank String theme, String timezone) {
}
