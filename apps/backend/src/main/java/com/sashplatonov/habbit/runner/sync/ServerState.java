package com.sashplatonov.habbit.runner.sync;

import java.time.Instant;

record ServerState(int version, Instant updatedAt) {
}
