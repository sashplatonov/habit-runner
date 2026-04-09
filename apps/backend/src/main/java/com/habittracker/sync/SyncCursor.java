package com.habittracker.sync;

import java.time.Instant;

record SyncCursor(Instant updatedAt, String id) {
}
