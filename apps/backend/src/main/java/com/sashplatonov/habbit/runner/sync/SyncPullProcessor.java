package com.sashplatonov.habbit.runner.sync;

import com.sashplatonov.habbit.runner.model.CheckinEntity;
import com.sashplatonov.habbit.runner.model.HabitEntity;
import com.sashplatonov.habbit.runner.model.TombstoneEntity;
import com.sashplatonov.habbit.runner.repository.CheckinRepository;
import com.sashplatonov.habbit.runner.repository.HabitRepository;
import com.sashplatonov.habbit.runner.repository.TombstoneRepository;
import com.sashplatonov.habbit.runner.sync.dto.PullResponseDto;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

@ApplicationScoped
@SuppressWarnings("PMD.CouplingBetweenObjects")
public class SyncPullProcessor {
  private final SyncPayloadCodec payloadCodec;
  private final SyncEntityMapper entityMapper;
  private final HabitRepository habitRepository;
  private final CheckinRepository checkinRepository;
  private final TombstoneRepository tombstoneRepository;

  public SyncPullProcessor(SyncPayloadCodec payloadCodec, SyncEntityMapper entityMapper) {
    this(payloadCodec, entityMapper, null, null, null);
  }

  @Inject
  @SuppressWarnings("PMD.ExcessiveParameterList")
  public SyncPullProcessor(
      SyncPayloadCodec payloadCodec,
      SyncEntityMapper entityMapper,
      HabitRepository habitRepository,
      CheckinRepository checkinRepository,
      TombstoneRepository tombstoneRepository
  ) {
    this.payloadCodec = payloadCodec;
    this.entityMapper = entityMapper;
    this.habitRepository = habitRepository;
    this.checkinRepository = checkinRepository;
    this.tombstoneRepository = tombstoneRepository;
  }

  public PullResponseDto pull(String userId, String since) {
    var cursor = payloadCodec.parseCursor(since);
    var habits = findHabits(userId, cursor);
    var checkins = findCheckins(userId, cursor);
    var tombstones = findTombstones(userId, cursor);
    var candidates = collectCursors(habits, checkins, tombstones);
    var nextCursor = payloadCodec.calculateNextCursor(candidates);

    return PullResponseDto.builder()
        .habits(habits.stream().map(entityMapper::serializeHabit).toList())
        .checkins(checkins.stream().map(entityMapper::serializeCheckin).toList())
        .tombstones(tombstones.stream().map(entityMapper::serializeTombstone).toList())
        .nextCursor(nextCursor)
        .serverTime(payloadCodec.toSyncIso(Instant.now()))
        .build();
  }

  protected List<HabitEntity> findHabits(String userId, SyncCursor cursor) {
    if (habitRepository != null) {
      return habitRepository.findPageForUser(userId, cursor == null ? null : cursor.updatedAt(), cursor == null ? null : cursor.id(), 200);
    }
    if (cursor == null) {
      return HabitEntity.<HabitEntity>find(
          "userId = ?1 ORDER BY updatedAt ASC, id ASC", userId
      ).page(0, 200).list();
    }
    return HabitEntity.<HabitEntity>find(
        "userId = ?1 AND (updatedAt > ?2 OR (updatedAt = ?2 AND id > ?3)) ORDER BY updatedAt ASC, id ASC",
        userId, cursor.updatedAt(), cursor.id()
    ).page(0, 200).list();
  }

  protected List<CheckinEntity> findCheckins(String userId, SyncCursor cursor) {
    if (checkinRepository != null) {
      return checkinRepository.findPageForUser(userId, cursor == null ? null : cursor.updatedAt(), cursor == null ? null : cursor.id(), 200);
    }
    if (cursor == null) {
      return CheckinEntity.<CheckinEntity>find(
          "userId = ?1 ORDER BY updatedAt ASC, id ASC", userId
      ).page(0, 200).list();
    }
    return CheckinEntity.<CheckinEntity>find(
        "userId = ?1 AND (updatedAt > ?2 OR (updatedAt = ?2 AND id > ?3)) ORDER BY updatedAt ASC, id ASC",
        userId, cursor.updatedAt(), cursor.id()
    ).page(0, 200).list();
  }

  protected List<TombstoneEntity> findTombstones(String userId, SyncCursor cursor) {
    if (tombstoneRepository != null) {
      return tombstoneRepository.findPageForUser(userId, cursor == null ? null : cursor.updatedAt(), cursor == null ? null : cursor.id(), 200);
    }
    if (cursor == null) {
      return TombstoneEntity.<TombstoneEntity>find(
          "userId = ?1 ORDER BY deletedAt ASC, id ASC", userId
      ).page(0, 200).list();
    }
    return TombstoneEntity.<TombstoneEntity>find(
        "userId = ?1 AND (deletedAt > ?2 OR (deletedAt = ?2 AND id > ?3)) ORDER BY deletedAt ASC, id ASC",
        userId, cursor.updatedAt(), cursor.id()
    ).page(0, 200).list();
  }

  private List<SyncCursor> collectCursors(
      List<HabitEntity> habits,
      List<CheckinEntity> checkins,
      List<TombstoneEntity> tombstones
  ) {
    var candidates = new ArrayList<SyncCursor>();
    habits.forEach(habit -> candidates.add(entityMapper.habitCursor(habit)));
    checkins.forEach(checkin -> candidates.add(entityMapper.checkinCursor(checkin)));
    tombstones.forEach(tombstone -> candidates.add(entityMapper.tombstoneCursor(tombstone)));
    return candidates;
  }
}
