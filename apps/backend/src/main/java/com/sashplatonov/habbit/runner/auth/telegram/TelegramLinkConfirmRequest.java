package com.sashplatonov.habbit.runner.auth.telegram;

import jakarta.validation.constraints.NotBlank;

public record TelegramLinkConfirmRequest(@NotBlank String token) {
}
