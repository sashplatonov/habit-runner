package com.sashplatonov.habbit.runner.auth.telegram;

import jakarta.validation.constraints.NotBlank;

public record TelegramSessionRequest(@NotBlank String initData) {
}
