package com.sashplatonov.habbit.runner.notification;

import io.smallrye.config.ConfigMapping;

import java.util.Optional;

@ConfigMapping(prefix = "notification")
public interface NotificationConfig {
  Optional<String> vapidPublicKey();
}
