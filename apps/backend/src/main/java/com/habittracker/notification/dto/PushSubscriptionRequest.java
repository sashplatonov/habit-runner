package com.habittracker.notification.dto;

public record PushSubscriptionRequest(String endpoint, PushSubscriptionKeys keys) {
}
