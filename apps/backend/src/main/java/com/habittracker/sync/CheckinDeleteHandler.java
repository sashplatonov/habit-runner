package com.habittracker.sync;

import com.habittracker.model.CheckinEntity;
import com.habittracker.model.TombstoneEntity;
import com.habittracker.sync.dto.CheckinPayloadDto;
import jakarta.enterprise.context.ApplicationScoped;

import java.time.LocalDate;

@ApplicationScoped
public class CheckinDeleteHandler {
  private final SyncPayloadCodec payloadCodec;

  public CheckinDeleteHandler(SyncPayloadCodec payloadCodec) {
    this.payloadCodec = payloadCodec;
  }

  public TombstoneEntity delete(CheckinDeleteRequest request) {
    var tombstone = new TombstoneEntity();
    tombstone.userId = request.userId();
    tombstone.entity = "checkin";
    var payloadId = request.payload() != null ? request.payload().id() : null;
    tombstone.entityId = payloadId != null ? payloadId : request.fallbackEntityId();
    tombstone.version = request.payload() != null && request.payload().version() != null ? request.payload().version() : 1;
    tombstone.setDeletedAt(payloadCodec.nextSyncDate(
        payloadCodec.parseInstantOrNow(request.payload() != null ? request.payload().updatedAt() : null)
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
      CheckinPayloadDto payload
  ) {
  }
}
