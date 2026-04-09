package com.habittracker.sync;

import com.habittracker.model.CheckinEntity;
import com.habittracker.model.HabitEntity;
import com.habittracker.sync.dto.PushConflict;
import com.habittracker.sync.dto.SyncOpDto;
import jakarta.enterprise.context.ApplicationScoped;
import lombok.extern.slf4j.Slf4j;

import java.time.Instant;
import java.time.LocalDate;

@ApplicationScoped
@Slf4j
public class CheckinSyncProcessor {

  private final SyncPayloadCodec payloadCodec;
  private final SyncValueCodec valueCodec;
  private final SyncEntityMapper entityMapper;
  private final CheckinDeleteHandler checkinDeleteHandler;

  public CheckinSyncProcessor(
      SyncPayloadCodec payloadCodec,
      SyncValueCodec valueCodec,
      SyncEntityMapper entityMapper,
      CheckinDeleteHandler checkinDeleteHandler
  ) {
    this.payloadCodec = payloadCodec;
    this.valueCodec = valueCodec;
    this.entityMapper = entityMapper;
    this.checkinDeleteHandler = checkinDeleteHandler;
  }

  public void apply(String userId, SyncOpDto op, SyncPushState state) {
    var payload = payloadCodec.toMap(op.payload());
    var habitId = valueCodec.asString(payload.get("habitId"));
    var dateString = valueCodec.asString(payload.get("date"));
    if (habitId == null || dateString == null) {
      log.debug("Ignoring checkin sync op with incomplete payload: opId={}", op.id());
      return;
    }
    if (hasCheckinParentConflict(userId, habitId, op.id(), state)) {
      return;
    }

    var date = payloadCodec.toLocalDate(dateString);
    var existing = CheckinEntity.<CheckinEntity>find(
        "habitId = ?1 and date = ?2 and userId = ?3", habitId, date, userId
    ).firstResult();
    var clientUpdated = payloadCodec.normalizeInstant(valueCodec.asString(payload.get("updatedAt")));

    if (SyncOperationType.from(op.type()) == SyncOperationType.DELETE) {
      state.addAppliedCheckinDelete(op.id(), checkinDeleteHandler.delete(new CheckinDeleteHandler.CheckinDeleteRequest(
          userId,
          habitId,
          date,
          existing != null ? existing.id : habitId + ":" + date,
          payload
      )));
      return;
    }

    var conflict = checkinConflict(op.id(), existing, clientUpdated);
    if (conflict != null) {
      log.debug("Detected checkin sync conflict: opId={} habitId={} date={}", op.id(), habitId, date);
      state.addConflict(conflict);
      return;
    }

    var checkin = ensureCheckin(existing, habitId, userId, date);
    checkin.done = valueCodec.asBoolean(payload.get("done"), false);
    checkin.count = Math.max(1, valueCodec.asInt(payload.get("count"), 1));
    checkin.version = Math.max(checkin.version, valueCodec.asInt(payload.get("version"), 0)) + 1;
    checkin.setUpdatedAt(payloadCodec.nextSyncDate(clientUpdated, checkin.updatedAtValue()));
    state.addAppliedCheckin(op.id(), checkin);
  }

  private boolean hasCheckinParentConflict(String userId, String habitId, String opId, SyncPushState state) {
    var parent = (HabitEntity) HabitEntity.findById(habitId);
    if (parent != null && userId.equals(parent.userId)) {
      return false;
    }
    log.debug("Detected missing parent habit for checkin sync: opId={} habitId={}", opId, habitId);
    state.addConflict(entityMapper.buildMissingEntityConflict(opId, "checkin habit belongs to another user"));
    return true;
  }

  private PushConflict checkinConflict(String opId, CheckinEntity existing, Instant clientUpdated) {
    if (existing == null || !existing.updatedAtValue().isAfter(clientUpdated)) {
      return null;
    }
    return entityMapper.buildConflict(opId, "server already has newer checkin", existing.version, existing.updatedAtValue());
  }

  private CheckinEntity ensureCheckin(CheckinEntity existing, String habitId, String userId, LocalDate date) {
    if (existing != null) {
      return existing;
    }
    var created = new CheckinEntity();
    created.habitId = habitId;
    created.userId = userId;
    created.setCheckinDate(date);
    created.persist();
    return created;
  }
}
