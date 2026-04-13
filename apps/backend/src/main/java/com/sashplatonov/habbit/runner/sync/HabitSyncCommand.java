package com.sashplatonov.habbit.runner.sync;

import com.sashplatonov.habbit.runner.sync.dto.HabitPayloadDto;

import java.time.Instant;

record HabitSyncCommand(String opId, String habitId, HabitPayloadDto payload, Instant clientUpdated) {
}
