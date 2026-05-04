package com.sashplatonov.habbit.runner.sync;

import com.sashplatonov.habbit.runner.sync.dto.SyncOpDto;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import lombok.extern.slf4j.Slf4j;

@ApplicationScoped
@Slf4j
public class HabitSyncProcessor {

  private final SyncPayloadCodec payloadCodec;
  private final SyncPayloadMapper payloadMapper;
  private final HabitSyncDeleteHandler habitSyncDeleteHandler;
  private final HabitSyncUpsertHandler habitSyncUpsertHandler;

  public HabitSyncProcessor(
      SyncPayloadCodec payloadCodec,
      SyncValueCodec valueCodec,
      SyncPayloadMapper payloadMapper
  ) {
    this(
        payloadCodec,
        payloadMapper,
        new HabitSyncDeleteHandler(payloadCodec),
        new HabitSyncUpsertHandler(valueCodec, new SyncJsonCodec(payloadCodec.objectMapper()))
    );
  }

  @Inject
  public HabitSyncProcessor(
      SyncPayloadCodec payloadCodec,
      SyncPayloadMapper payloadMapper,
      HabitSyncDeleteHandler habitSyncDeleteHandler,
      HabitSyncUpsertHandler habitSyncUpsertHandler
  ) {
    this.payloadCodec = payloadCodec;
    this.payloadMapper = payloadMapper;
    this.habitSyncDeleteHandler = habitSyncDeleteHandler;
    this.habitSyncUpsertHandler = habitSyncUpsertHandler;
  }

  public void apply(String userId, SyncOpDto op, SyncPushState state) {
    var command = createCommand(op);
    if (command == null) {
      log.debug("Ignoring habit sync op without habit id: opId={}", op.id());
      return;
    }
    if (op.type() == SyncOperationType.DELETE) {
      state.addAppliedHabitDelete(command.opId(), habitSyncDeleteHandler.delete(userId, command.habitId(), command.payload()));
      return;
    }

    applyUpsert(userId, command, state);
  }

  private HabitSyncCommand createCommand(SyncOpDto op) {
    var payload = payloadMapper.toHabitPayload(op.payload());
    var habitId = payload == null || payload.id() == null || payload.id().isBlank() ? null : payload.id();
    if (habitId == null) {
      return null;
    }
    return new HabitSyncCommand(
        op.id(),
        habitId,
        payload,
        payloadCodec.normalizeInstant(payload != null ? payload.updatedAt() : null)
    );
  }

  private void applyUpsert(String userId, HabitSyncCommand command, SyncPushState state) {
    var existing = habitSyncUpsertHandler.findHabitById(command.habitId());
    if (addConflictIfPresent(userId, command, existing, state)) {
      return;
    }

    var createdAt = command.payload() != null ? command.payload().createdAt() : null;
    var habit = habitSyncUpsertHandler.ensureHabitForUpsert(
        existing,
        command.habitId(),
        userId,
      createdAt != null ? payloadCodec.parseInstantOrNow(createdAt) : java.time.Instant.now()
    );
    habitSyncUpsertHandler.populateHabit(habit, command.payload(), command.clientUpdated(), payloadCodec);
    if (existing == null) {
      habitSyncUpsertHandler.saveHabit(habit);
    }
    state.addAppliedHabit(command.opId(), habit);
  }

  private boolean addConflictIfPresent(
      String userId,
      HabitSyncCommand command,
      Object existingCandidate,
      SyncPushState state
  ) {
    if (!(existingCandidate instanceof com.sashplatonov.habbit.runner.model.HabitEntity existing)) {
      return false;
    }
    if (!userId.equals(existing.getUserId())) {
      log.debug("Detected habit sync conflict: opId={} habitId={}", command.opId(), command.habitId());
      state.addConflict(SyncConflicts.missingEntity(command.opId(), "habit belongs to another user"));
      return true;
    }
    if (existing.getUpdatedAt().isAfter(command.clientUpdated())) {
      log.debug("Detected habit sync conflict: opId={} habitId={}", command.opId(), command.habitId());
      state.addConflict(SyncConflicts.newerServerValue(
          payloadCodec,
          command.opId(),
          "server already has newer habit",
          SyncConflicts.serverState(existing.getVersion(), existing.getUpdatedAt())
      ));
      return true;
    }
    return false;
  }
}
