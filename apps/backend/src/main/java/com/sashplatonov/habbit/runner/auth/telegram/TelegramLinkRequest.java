package com.sashplatonov.habbit.runner.auth.telegram;

import jakarta.validation.constraints.NotBlank;

public record TelegramLinkRequest(@NotBlank String token, @NotBlank String initData) {
}
