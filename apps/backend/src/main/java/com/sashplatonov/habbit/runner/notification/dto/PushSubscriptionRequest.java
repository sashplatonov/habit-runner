package com.sashplatonov.habbit.runner.notification.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record PushSubscriptionRequest(@NotBlank String endpoint, @Valid @NotNull PushSubscriptionKeys keys) {
}
