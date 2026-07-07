package com.sashplatonov.habbit.runner.checkin;

import com.sashplatonov.habbit.runner.model.CheckinEntity;
import org.junit.jupiter.api.Test;
import org.mapstruct.factory.Mappers;

import java.time.Instant;
import java.time.LocalDate;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;

class CheckinMapperTest {
  private final CheckinMapper checkinMapper = Mappers.getMapper(CheckinMapper.class);

  @Test
  void shouldMapCheckinEntityToResponse() {
    var entity = new CheckinEntity();
    entity.setId("checkin-1");
    entity.setHabitId("habit-1");
    entity.setUserId("user-1");
    entity.setDate(LocalDate.of(2026, 4, 10));
    entity.setDone(true);
    entity.setCount(3);
    entity.setCreatedAt(Instant.parse("2026-04-10T10:00:00Z"));
    entity.setUpdatedAt(Instant.parse("2026-04-10T10:05:00Z"));
    entity.setVersion(2);

    var response = checkinMapper.toResponse(entity);

    assertEquals("checkin-1", response.id());
    assertEquals("habit-1", response.habitId());
    assertEquals("2026-04-10", response.date());
    assertEquals("2026-04-10T10:00:00Z", response.createdAt());
    assertEquals("2026-04-10T10:05:00Z", response.updatedAt());
  }

  @Test
  void shouldHandleNullValuesInDefaultHelpers() {
    assertNull(checkinMapper.toDateString(null));
    assertNull(checkinMapper.toInstantString(null));
  }
}
