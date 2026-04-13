package com.sashplatonov.habbit.runner.sync;

import com.sashplatonov.habbit.runner.model.CheckinEntity;
import com.sashplatonov.habbit.runner.model.HabitEntity;
import com.sashplatonov.habbit.runner.model.TombstoneEntity;
import com.sashplatonov.habbit.runner.repository.CheckinRepository;
import com.sashplatonov.habbit.runner.repository.HabitRepository;
import com.sashplatonov.habbit.runner.repository.TombstoneRepository;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;

import java.util.List;

@ApplicationScoped
public class SyncPullStore {
  private final HabitRepository habitRepository;
  private final CheckinRepository checkinRepository;
  private final TombstoneRepository tombstoneRepository;

  public SyncPullStore() {
    this(null, null, null);
  }

  @Inject
  public SyncPullStore(
      HabitRepository habitRepository,
      CheckinRepository checkinRepository,
      TombstoneRepository tombstoneRepository
  ) {
    this.habitRepository = habitRepository;
    this.checkinRepository = checkinRepository;
    this.tombstoneRepository = tombstoneRepository;
  }

  public List<HabitEntity> findHabits(String userId, SyncCursor cursor) {
    if (habitRepository != null) {
      return habitRepository.findPageForUser(
          userId,
          cursor == null ? null : cursor.updatedAt(),
          cursor == null ? null : cursor.id(),
          200
      );
    }
    if (cursor == null) {
      return HabitEntity.<HabitEntity>find(
          "userId = ?1 ORDER BY updatedAt ASC, id ASC", userId
      ).page(0, 200).list();
    }
    return HabitEntity.<HabitEntity>find(
        "userId = ?1 AND (updatedAt > ?2 OR (updatedAt = ?2 AND id > ?3)) ORDER BY updatedAt ASC, id ASC",
        userId,
        cursor.updatedAt(),
        cursor.id()
    ).page(0, 200).list();
  }

  public List<CheckinEntity> findCheckins(String userId, SyncCursor cursor) {
    if (checkinRepository != null) {
      return checkinRepository.findPageForUser(
          userId,
          cursor == null ? null : cursor.updatedAt(),
          cursor == null ? null : cursor.id(),
          200
      );
    }
    if (cursor == null) {
      return CheckinEntity.<CheckinEntity>find(
          "userId = ?1 ORDER BY updatedAt ASC, id ASC", userId
      ).page(0, 200).list();
    }
    return CheckinEntity.<CheckinEntity>find(
        "userId = ?1 AND (updatedAt > ?2 OR (updatedAt = ?2 AND id > ?3)) ORDER BY updatedAt ASC, id ASC",
        userId,
        cursor.updatedAt(),
        cursor.id()
    ).page(0, 200).list();
  }

  public List<TombstoneEntity> findTombstones(String userId, SyncCursor cursor) {
    if (tombstoneRepository != null) {
      return tombstoneRepository.findPageForUser(
          userId,
          cursor == null ? null : cursor.updatedAt(),
          cursor == null ? null : cursor.id(),
          200
      );
    }
    if (cursor == null) {
      return TombstoneEntity.<TombstoneEntity>find(
          "userId = ?1 ORDER BY deletedAt ASC, id ASC", userId
      ).page(0, 200).list();
    }
    return TombstoneEntity.<TombstoneEntity>find(
        "userId = ?1 AND (deletedAt > ?2 OR (deletedAt = ?2 AND id > ?3)) ORDER BY deletedAt ASC, id ASC",
        userId,
        cursor.updatedAt(),
        cursor.id()
    ).page(0, 200).list();
  }
}
