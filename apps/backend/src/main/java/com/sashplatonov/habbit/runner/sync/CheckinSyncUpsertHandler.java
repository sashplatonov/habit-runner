package com.sashplatonov.habbit.runner.sync;

import com.sashplatonov.habbit.runner.model.CheckinEntity;
import com.sashplatonov.habbit.runner.sync.dto.PushConflict;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import lombok.extern.slf4j.Slf4j;

import java.time.Instant;
import java.time.LocalDate;

@ApplicationScoped
@Slf4j
public class CheckinSyncUpsertHandler {
  private final CheckinSyncStore checkinSyncStore;

  public CheckinSyncUpsertHandler() {
    this(new CheckinSyncStore());
  }

  @Inject
  public CheckinSyncUpsertHandler(CheckinSyncStore checkinSyncStore) {
    this.checkinSyncStore = checkinSyncStore;
  }

  public boolean hasParentConflict(String userId, String habitId, String opId, SyncPushState state) {
    var parent = checkinSyncStore.findHabit(habitId);
    if (parent != null && userId.equals(parent.getUserId())) {
      return false;
    }
    log.debug("Detected missing parent habit for checkin sync: opId={} habitId={}", opId, habitId);
    state.addConflict(SyncConflicts.missingEntity(opId, "checkin habit belongs to another user"));
    return true;
  }

  public CheckinEntity findCheckin(String habitId, LocalDate date, String userId) {
    return checkinSyncStore.findCheckin(habitId, date, userId);
  }

  public PushConflict conflict(String opId, CheckinEntity existing, Instant clientUpdated, SyncPayloadCodec payloadCodec) {
    var existingUpdatedAt = existing == null ? null : existing.updatedAtValue();
    if (existingUpdatedAt == null || !existingUpdatedAt.isAfter(clientUpdated)) {
      return null;
    }
    return SyncConflicts.newerServerValue(
        payloadCodec,
        opId,
        "server already has newer checkin",
        SyncConflicts.serverState(existing.getVersion(), existingUpdatedAt)
    );
  }

  public CheckinEntity ensureCheckin(CheckinEntity existing, String habitId, String userId, LocalDate date) {
    if (existing != null) {
      return existing;
    }
    var created = new CheckinEntity();
    created.setHabitId(habitId);
    created.setUserId(userId);
    created.setDate(date);
    checkinSyncStore.saveCheckin(created);
    return created;
  }
}
