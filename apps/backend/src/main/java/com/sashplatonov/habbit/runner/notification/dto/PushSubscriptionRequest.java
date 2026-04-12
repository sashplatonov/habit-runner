package com.sashplatonov.habbit.runner.notification.dto;

public record PushSubscriptionRequest(String endpoint, PushSubscriptionKeys keys) {
}
