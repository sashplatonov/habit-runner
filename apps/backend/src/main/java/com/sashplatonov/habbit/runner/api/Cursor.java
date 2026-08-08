package com.sashplatonov.habbit.runner.api;

import java.time.Instant;

public record Cursor(Instant updatedAt, String id) {
}
