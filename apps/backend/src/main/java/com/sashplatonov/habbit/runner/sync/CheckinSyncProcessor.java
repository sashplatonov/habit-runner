package com.sashplatonov.habbit.runner.sync;

import com.sashplatonov.habbit.runner.model.CheckinEntity;
import com.sashplatonov.habbit.runner.sync.dto.CheckinPayloadDto;
import com.sashplatonov.habbit.runner.sync.dto.SyncOpDto;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import lombok.extern.slf4j.Slf4j;

import java.time.Instant;
import java.time.LocalDate;

@ApplicationScoped
@Slf4j
public class CheckinSyncProcessor {

  private final SyncPayloadCodec payloadCodec;
  private final CheckinDeleteHandler checkinDeleteHandler;
  private final SyncPayloadMapper payloadMapper;
  private final CheckinSyncUpsertHandler checkinSyncUpsertHandler;

  public CheckinSyncProcessor(
      SyncPayloadCodec payloadCodec,
      CheckinDeleteHandler checkinDeleteHandler,
      SyncPayloadMapper payloadMapper
  ) {
    this(payloadCodec, payloadMapper, checkinDeleteHandler, new CheckinSyncUpsertHandler());
  }

  @Inject
  public CheckinSyncProcessor(
      SyncPayloadCodec payloadCodec,
      SyncPayloadMapper payloadMapper,
      CheckinDeleteHandler checkinDeleteHandler,
      CheckinSyncUpsertHandler checkinSyncUpsertHandler
  ) {
    this.payloadCodec = payloadCodec;
    this.checkinDeleteHandler = checkinDeleteHandler;
    this.payloadMapper = payloadMapper;
    this.checkinSyncUpsertHandler = checkinSyncUpsertHandler;
  }

  public void apply(String userId, SyncOpDto op, SyncPushState state) {
    var payload = payloadMapper.toCheckinPayload(op.payload());
    var command = createCommand(userId, op, payload);
    if (command == null) {
      log.debug("Ignoring checkin sync op with incomplete payload: opId={}", op.id());
      return;
    }
    if (checkinSyncUpsertHandler.hasParentConflict(command.userId(), command.habitId(), command.opId(), state)) {
      return;
    }

    if (op.type() == SyncOperationType.DELETE) {
      handleDelete(command, state);
      return;
    }

    handleUpsert(command, state);
  }

  private CheckinCommand createCommand(String userId, SyncOpDto op, CheckinPayloadDto payload) {
    var habitId = payload != null ? payload.habitId() : null;
    var dateString = payload != null ? payload.date() : null;
    if (habitId == null || dateString == null) {
      return null;
    }
    return new CheckinCommand(
        userId,
        op.id(),
        habitId,
        payloadCodec.toLocalDate(dateString),
        payload,
        payloadCodec.normalizeInstant(payload.updatedAt())
    );
  }

  private void handleDelete(CheckinCommand command, SyncPushState state) {
    var existing = checkinSyncUpsertHandler.findCheckin(command.habitId(), command.date(), command.userId());
    state.addAppliedCheckinDelete(command.opId(), checkinDeleteHandler.delete(
        new CheckinDeleteHandler.CheckinDeleteRequest(
            command.userId(),
            command.habitId(),
            command.date(),
            existing != null ? existing.id : command.habitId() + ":" + command.date(),
            command.payload()
        )
    ));
  }

  private void handleUpsert(CheckinCommand command, SyncPushState state) {
    var existing = checkinSyncUpsertHandler.findCheckin(command.habitId(), command.date(), command.userId());
    var conflict = checkinSyncUpsertHandler.conflict(command.opId(), existing, command.clientUpdated(), payloadCodec);
    if (conflict != null) {
      log.debug(
          "Detected checkin sync conflict: opId={} habitId={} date={}",
          command.opId(),
          command.habitId(),
          command.date()
      );
      state.addConflict(conflict);
      return;
    }

    var checkin = checkinSyncUpsertHandler.ensureCheckin(
        existing,
        command.habitId(),
        command.userId(),
        command.date()
    );
    applyCheckinPayload(checkin, command);
    state.addAppliedCheckin(command.opId(), checkin);
  }

  private void applyCheckinPayload(CheckinEntity checkin, CheckinCommand command) {
    var payload = command.payload();
    checkin.done = Boolean.TRUE.equals(payload.done());
    checkin.count = Math.max(1, payload.count() != null ? payload.count() : 1);
    checkin.version = Math.max(checkin.version, payload.version() != null ? payload.version() : 0) + 1;
    checkin.setUpdatedAt(payloadCodec.nextSyncDate(command.clientUpdated(), checkin.updatedAtValue()));
  }

  private record CheckinCommand(
      String userId,
      String opId,
      String habitId,
      LocalDate date,
      CheckinPayloadDto payload,
      Instant clientUpdated
  ) {
  }
}
