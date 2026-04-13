package com.sashplatonov.habbit.runner.sync;

import com.sashplatonov.habbit.runner.model.CheckinEntity;
import com.sashplatonov.habbit.runner.model.HabitEntity;
import com.sashplatonov.habbit.runner.model.TombstoneEntity;
import com.sashplatonov.habbit.runner.repository.CheckinRepository;
import com.sashplatonov.habbit.runner.repository.HabitRepository;
import com.sashplatonov.habbit.runner.repository.TombstoneRepository;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;

@ApplicationScoped
public class HabitSyncStore {
  private final HabitRepository habitRepository;
  private final CheckinRepository checkinRepository;
  private final TombstoneRepository tombstoneRepository;

  public HabitSyncStore() {
    this(null, null, null);
  }

  @Inject
  public HabitSyncStore(
      HabitRepository habitRepository,
      CheckinRepository checkinRepository,
      TombstoneRepository tombstoneRepository
  ) {
    this.habitRepository = habitRepository;
    this.checkinRepository = checkinRepository;
    this.tombstoneRepository = tombstoneRepository;
  }

  public HabitEntity findHabitById(String habitId) {
    return habitRepository == null
        ? (HabitEntity) HabitEntity.findById(habitId)
        : habitRepository.findHabitById(habitId);
  }

  public void saveHabit(HabitEntity habit) {
    if (habitRepository != null) {
      habitRepository.save(habit);
      return;
    }
    habit.persist();
  }

  public void saveTombstone(TombstoneEntity tombstone) {
    if (tombstoneRepository != null) {
      tombstoneRepository.save(tombstone);
      return;
    }
    tombstone.persist();
  }

  public void deleteCheckinsForHabit(String habitId, String userId) {
    if (checkinRepository != null) {
      checkinRepository.deleteByHabitIdAndUserId(habitId, userId);
      return;
    }
    CheckinEntity.delete("habitId = ?1 and userId = ?2", habitId, userId);
  }

  public void deleteHabit(String habitId, String userId) {
    if (habitRepository != null) {
      habitRepository.deleteByIdAndUserId(habitId, userId);
      return;
    }
    HabitEntity.delete("id = ?1 and userId = ?2", habitId, userId);
  }
}
