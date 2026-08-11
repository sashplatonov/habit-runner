package com.sashplatonov.habbit.runner.auth.dto;

public record TelegramSessionResponse(String userId, String email, boolean existingAccount) {
}
