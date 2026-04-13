package com.sashplatonov.habbit.runner.sync;

import com.sashplatonov.habbit.runner.model.CheckinEntity;
import com.sashplatonov.habbit.runner.model.HabitEntity;
import com.sashplatonov.habbit.runner.repository.CheckinRepository;
import com.sashplatonov.habbit.runner.repository.HabitRepository;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;

import java.time.LocalDate;

@ApplicationScoped
public class CheckinSyncStore {
  private final CheckinRepository checkinRepository;
  private final HabitRepository habitRepository;

  public CheckinSyncStore() {
    this(null, null);
  }

  @Inject
  public CheckinSyncStore(CheckinRepository checkinRepository, HabitRepository habitRepository) {
    this.checkinRepository = checkinRepository;
    this.habitRepository = habitRepository;
  }

  public CheckinEntity findCheckin(String habitId, LocalDate date, String userId) {
    if (checkinRepository != null) {
      return checkinRepository.findByHabitDateAndUserId(habitId, date, userId);
    }
    return CheckinEntity.<CheckinEntity>find(
        "habitId = ?1 and date = ?2 and userId = ?3",
        habitId,
        date,
        userId
    ).firstResult();
  }

  public HabitEntity findHabit(String habitId) {
    return habitRepository == null
        ? (HabitEntity) HabitEntity.findById(habitId)
        : habitRepository.findHabitById(habitId);
  }

  public void saveCheckin(CheckinEntity checkin) {
    if (checkinRepository != null) {
      checkinRepository.save(checkin);
      return;
    }
    checkin.persist();
  }
}
