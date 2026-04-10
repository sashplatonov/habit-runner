package com.habittracker.sync;

import lombok.Builder;

import java.time.Instant;

@Builder
record SyncCursor(Instant updatedAt, String id) {
}
