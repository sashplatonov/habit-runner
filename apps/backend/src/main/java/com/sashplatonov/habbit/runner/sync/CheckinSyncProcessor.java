package com.sashplatonov.habbit.runner.sync;

import com.sashplatonov.habbit.runner.model.CheckinEntity;
import com.sashplatonov.habbit.runner.model.HabitEntity;
import com.sashplatonov.habbit.runner.repository.CheckinRepository;
import com.sashplatonov.habbit.runner.repository.HabitRepository;
import com.sashplatonov.habbit.runner.sync.dto.PushConflict;
import com.sashplatonov.habbit.runner.sync.dto.SyncOpDto;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import lombok.extern.slf4j.Slf4j;

import java.time.Instant;
import java.time.LocalDate;

@ApplicationScoped
@Slf4j
@SuppressWarnings("PMD.CouplingBetweenObjects")
public class CheckinSyncProcessor {

  private final SyncPayloadCodec payloadCodec;
  private final SyncEntityMapper entityMapper;
  private final CheckinDeleteHandler checkinDeleteHandler;
  private final SyncPayloadMapper payloadMapper;
  private final CheckinRepository checkinRepository;
  private final HabitRepository habitRepository;

  public CheckinSyncProcessor(
      SyncPayloadCodec payloadCodec,
      SyncEntityMapper entityMapper,
      CheckinDeleteHandler checkinDeleteHandler,
      SyncPayloadMapper payloadMapper
  ) {
    this(payloadCodec, entityMapper, checkinDeleteHandler, payloadMapper, null, null);
  }

  @Inject
  @SuppressWarnings("PMD.ExcessiveParameterList")
  public CheckinSyncProcessor(
      SyncPayloadCodec payloadCodec,
      SyncEntityMapper entityMapper,
      CheckinDeleteHandler checkinDeleteHandler,
      SyncPayloadMapper payloadMapper,
      CheckinRepository checkinRepository,
      HabitRepository habitRepository
  ) {
    this.payloadCodec = payloadCodec;
    this.entityMapper = entityMapper;
    this.checkinDeleteHandler = checkinDeleteHandler;
    this.payloadMapper = payloadMapper;
    this.checkinRepository = checkinRepository;
    this.habitRepository = habitRepository;
  }

  @SuppressWarnings({"PMD.CognitiveComplexity", "PMD.CyclomaticComplexity", "PMD.NPathComplexity"})
  public void apply(String userId, SyncOpDto op, SyncPushState state) {
    var payload = payloadMapper.toCheckinPayload(op.payload());
    var habitId = payload != null ? payload.habitId() : null;
    var dateString = payload != null ? payload.date() : null;
    if (habitId == null || dateString == null) {
      log.debug("Ignoring checkin sync op with incomplete payload: opId={}", op.id());
      return;
    }
    if (hasCheckinParentConflict(userId, habitId, op.id(), state)) {
      return;
    }

    var date = payloadCodec.toLocalDate(dateString);
    var existing = findCheckin(habitId, date, userId);
    var clientUpdated = payloadCodec.normalizeInstant(payload != null ? payload.updatedAt() : null);

    if (op.type() == SyncOperationType.DELETE) {
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
    checkin.done = payload != null && payload.done() != null && payload.done();
    checkin.count = Math.max(1, payload != null && payload.count() != null ? payload.count() : 1);
    checkin.version = Math.max(checkin.version, payload != null && payload.version() != null ? payload.version() : 0) + 1;
    checkin.setUpdatedAt(payloadCodec.nextSyncDate(clientUpdated, checkin.updatedAtValue()));
    state.addAppliedCheckin(op.id(), checkin);
  }

  private boolean hasCheckinParentConflict(String userId, String habitId, String opId, SyncPushState state) {
    var parent = findHabit(habitId);
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
    saveCheckin(created);
    return created;
  }

  private CheckinEntity findCheckin(String habitId, LocalDate date, String userId) {
    if (checkinRepository != null) {
      return checkinRepository.findByHabitDateAndUserId(habitId, date, userId);
    }
    return CheckinEntity.<CheckinEntity>find(
        "habitId = ?1 and date = ?2 and userId = ?3", habitId, date, userId
    ).firstResult();
  }

  private HabitEntity findHabit(String habitId) {
    return habitRepository == null ? (HabitEntity) HabitEntity.findById(habitId) : habitRepository.findHabitById(habitId);
  }

  private void saveCheckin(CheckinEntity checkin) {
    if (checkinRepository != null) {
      checkinRepository.save(checkin);
      return;
    }
    checkin.persist();
  }
}
