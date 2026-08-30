package com.sashplatonov.habbit.runner.auth;

import java.time.Instant;

record StoredState(String state, String returnTo, Instant expiresAt, String linkUserId) {
}
