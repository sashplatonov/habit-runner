package com.sashplatonov.habbit.runner.auth.dto;

import jakarta.validation.constraints.NotBlank;

public record UpdateThemeRequest(@NotBlank String theme) {
}
