package com.sashplatonov.habbit.runner.sync;

import com.sashplatonov.habbit.runner.sync.dto.CheckinPayloadDto;

import java.time.Instant;
import java.time.LocalDate;

record CheckinCommand(
    String userId,
    String opId,
    String habitId,
    LocalDate date,
    CheckinPayloadDto payload,
    Instant clientUpdated
) {
}
