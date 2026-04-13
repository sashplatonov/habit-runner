package com.sashplatonov.habbit.runner.sync;

import com.sashplatonov.habbit.runner.model.TombstoneEntity;
import com.sashplatonov.habbit.runner.sync.dto.HabitPayloadDto;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;

@ApplicationScoped
public class HabitSyncDeleteHandler {
  private final SyncPayloadCodec payloadCodec;
  private final HabitSyncStore habitSyncStore;

  public HabitSyncDeleteHandler(SyncPayloadCodec payloadCodec) {
    this(payloadCodec, new HabitSyncStore());
  }

  @Inject
  public HabitSyncDeleteHandler(SyncPayloadCodec payloadCodec, HabitSyncStore habitSyncStore) {
    this.payloadCodec = payloadCodec;
    this.habitSyncStore = habitSyncStore;
  }

  public TombstoneEntity delete(String userId, String habitId, HabitPayloadDto payload) {
    var tombstone = new TombstoneEntity();
    tombstone.userId = userId;
    tombstone.entity = "habit";
    tombstone.entityId = habitId;
    tombstone.version = payload != null && payload.version() != null ? payload.version() : 1;
    tombstone.setDeletedAt(payloadCodec.nextSyncDate(
        payloadCodec.parseInstantOrNow(payload != null ? payload.updatedAt() : null)
    ));
    habitSyncStore.saveTombstone(tombstone);
    habitSyncStore.deleteCheckinsForHabit(habitId, userId);
    habitSyncStore.deleteHabit(habitId, userId);
    return tombstone;
  }
}
