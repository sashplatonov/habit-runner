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

  @SuppressWarnings({"PMD.CyclomaticComplexity", "PMD.NPathComplexity"})
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
    if (tombstoneRepository != null) {
      tombstoneRepository.save(tombstone);
    } else {
      tombstone.persist();
    }

    if (checkinRepository != null) {
      checkinRepository.deleteByHabitIdUserIdAndDate(request.habitId(), request.userId(), request.date());
    } else {
      CheckinEntity.delete("habitId = ?1 and userId = ?2 and date = ?3", request.habitId(), request.userId(), request.date());
    }
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
