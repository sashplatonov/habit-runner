package com.sashplatonov.habbit.runner.notification.dto;

import jakarta.validation.constraints.NotBlank;

public record PushSubscriptionEndpointRequest(@NotBlank String endpoint) {
}