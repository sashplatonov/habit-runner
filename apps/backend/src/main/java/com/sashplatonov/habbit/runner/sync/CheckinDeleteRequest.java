package com.sashplatonov.habbit.runner.sync;

import com.sashplatonov.habbit.runner.sync.dto.CheckinPayloadDto;

import java.time.LocalDate;

record CheckinDeleteRequest(
    String userId,
    String habitId,
    LocalDate date,
    String fallbackEntityId,
    CheckinPayloadDto payload
) {
}
