package com.habittracker.sync;

import com.habittracker.model.CheckinEntity;
import com.habittracker.model.TombstoneEntity;
import jakarta.enterprise.context.ApplicationScoped;

import java.time.LocalDate;
import java.util.Map;

@ApplicationScoped
public class CheckinDeleteHandler {
  private final SyncPayloadCodec payloadCodec;
  private final SyncValueCodec valueCodec;

  public CheckinDeleteHandler(SyncPayloadCodec payloadCodec, SyncValueCodec valueCodec) {
    this.payloadCodec = payloadCodec;
    this.valueCodec = valueCodec;
  }

  public TombstoneEntity delete(CheckinDeleteRequest request) {
    var tombstone = new TombstoneEntity();
    tombstone.userId = request.userId();
    tombstone.entity = "checkin";
    var payloadId = valueCodec.asString(request.payload().get("id"));
    tombstone.entityId = payloadId != null ? payloadId : request.fallbackEntityId();
    tombstone.version = valueCodec.asInt(request.payload().get("version"), 1);
    tombstone.setDeletedAt(payloadCodec.nextSyncDate(
        payloadCodec.parseInstantOrNow(valueCodec.asString(request.payload().get("updatedAt")))
    ));
    tombstone.persist();

    CheckinEntity.delete("habitId = ?1 and userId = ?2 and date = ?3", request.habitId(), request.userId(), request.date());
    return tombstone;
  }

  record CheckinDeleteRequest(
      String userId,
      String habitId,
      LocalDate date,
      String fallbackEntityId,
      Map<String, Object> payload
  ) {
  }
}
