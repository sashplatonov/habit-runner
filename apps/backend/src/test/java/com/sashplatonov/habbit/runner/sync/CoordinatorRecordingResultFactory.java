package com.sashplatonov.habbit.runner.sync;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.sashplatonov.habbit.runner.model.HabitColor;
import com.sashplatonov.habbit.runner.model.HabitFrequency;
import com.sashplatonov.habbit.runner.model.HabitType;
import com.sashplatonov.habbit.runner.sync.dto.CheckinDto;
import com.sashplatonov.habbit.runner.sync.dto.HabitDto;
import com.sashplatonov.habbit.runner.sync.dto.PushResponseDto;
import com.sashplatonov.habbit.runner.sync.dto.TombstoneDto;

import java.util.List;

final class CoordinatorRecordingResultFactory extends SyncPushResultFactory {
  private SyncPushState lastState;

  CoordinatorRecordingResultFactory() {
    super(new SyncPayloadCodec(new ObjectMapper()), new SyncEntityMapper(new SyncPayloadCodec(new ObjectMapper())));
  }

  SyncPushState getLastState() {
    return lastState;
  }

  @Override
  public PushResponseDto create(SyncPushState state) {
    lastState = state;
    return PushResponseDto.builder()
        .applied(state.applied())
        .conflicts(state.conflicts())
        .habits(List.of(HabitDto.builder()
            .id("habit-1")
            .name("Habit")
            .description("")
            .color(HabitColor.LEGACY_NORD)
            .icon("star")
            .frequency(HabitFrequency.DAILY)
            .customDays(null)
            .schedule(null)
            .targetStreak(1)
            .dailyTarget(1)
            .tags(List.of())
            .archived(false)
            .createdAt("2026-04-10T15:00:00Z")
            .updatedAt("2026-04-10T15:00:00Z")
            .version(1)
            .sortOrder(0)
            .reminderTime(null)
            .reminderEnabled(false)
            .type(HabitType.POSITIVE)
            .freezeDays(List.of())
            .build()))
        .checkins(List.of(CheckinDto.builder()
            .id("checkin-1")
            .habitId("habit-1")
            .date("2026-04-10")
            .done(true)
            .count(1)
            .updatedAt("2026-04-10T15:00:00Z")
            .version(1)
            .build()))
        .tombstones(List.of(TombstoneDto.builder()
            .id("tombstone-1")
            .entity("habit")
            .entityId("habit-1")
            .deletedAt("2026-04-10T15:00:00Z")
            .version(1)
            .build()))
        .nextCursor(null)
        .serverTime("2026-04-10T15:00:00Z")
        .build();
  }
}
