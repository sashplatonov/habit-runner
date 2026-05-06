package com.sashplatonov.habbit.runner.sync;

import com.sashplatonov.habbit.runner.model.CheckinEntity;
import com.sashplatonov.habbit.runner.model.TombstoneEntity;
import com.sashplatonov.habbit.runner.repository.CheckinRepository;
import com.sashplatonov.habbit.runner.repository.TombstoneRepository;
import com.sashplatonov.habbit.runner.sync.dto.CheckinPayloadDto;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;

import java.time.LocalDate;

@ApplicationScoped
public class CheckinDeleteHandler {
  private final SyncPayloadCodec payloadCodec;
  private final TombstoneRepository tombstoneRepository;
  private final CheckinRepository checkinRepository;

  public CheckinDeleteHandler(SyncPayloadCodec payloadCodec) {
    this(payloadCodec, null, null);
  }

  @Inject
  public CheckinDeleteHandler(
      SyncPayloadCodec payloadCodec,
      TombstoneRepository tombstoneRepository,
      CheckinRepository checkinRepository
  ) {
    this.payloadCodec = payloadCodec;
    this.tombstoneRepository = tombstoneRepository;
    this.checkinRepository = checkinRepository;
  }

  public TombstoneEntity delete(CheckinDeleteRequest request) {
    var tombstone = new TombstoneEntity();
    tombstone.setUserId(request.userId());
    tombstone.setEntity("checkin");
    tombstone.setEntityId(entityId(request));
    tombstone.setVersion(version(request.payload()));
    tombstone.setDeletedAt(deletedAt(request.payload()));
    saveTombstone(tombstone);
    deleteCheckin(request);
    return tombstone;
  }

  private String entityId(CheckinDeleteRequest request) {
    var payload = request.payload();
    var payloadId = payload == null ? null : payload.id();
    return payloadId != null ? payloadId : request.fallbackEntityId();
  }

  private int version(CheckinPayloadDto payload) {
    return payload != null && payload.version() != null ? payload.version() : 1;
  }

  private java.time.Instant deletedAt(CheckinPayloadDto payload) {
    return payloadCodec.nextSyncDate(payloadCodec.parseInstantOrNow(payload == null ? null : payload.updatedAt()));
  }

  private void saveTombstone(TombstoneEntity tombstone) {
    if (tombstoneRepository != null) {
      tombstoneRepository.save(tombstone);
      return;
    }
    tombstone.persist();
  }

  private void deleteCheckin(CheckinDeleteRequest request) {
    if (checkinRepository != null) {
      checkinRepository.deleteByHabitIdUserIdAndDate(request.habitId(), request.userId(), request.date());
      return;
    }
    CheckinEntity.delete(
        "habitId = ?1 and userId = ?2 and date = ?3",
        request.habitId(),
        request.userId(),
        request.date()
    );
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
