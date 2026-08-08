package com.sashplatonov.habbit.runner.habit;

import com.sashplatonov.habbit.runner.auth.security.CurrentUser;
import com.sashplatonov.habbit.runner.auth.security.CurrentUserContext;
import com.sashplatonov.habbit.runner.model.HabitColor;
import com.sashplatonov.habbit.runner.model.HabitEntity;
import com.sashplatonov.habbit.runner.model.HabitFrequency;
import com.sashplatonov.habbit.runner.model.HabitType;
import com.sashplatonov.habbit.runner.repository.HabitRepository;
import jakarta.ws.rs.BadRequestException;
import org.junit.jupiter.api.Test;
import org.mapstruct.factory.Mappers;

import java.math.BigInteger;
import java.time.Instant;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class HabitPageResourceTest {
  private final HabitRepository habitRepository = mock(HabitRepository.class);
  private final HabitPageResource resource = resource();

  @Test
  void shouldTrimLookaheadRowAndOmitCursorOnFinalPage() {
    var first = habit("habit-1", Instant.parse("2026-04-10T10:00:00Z"));
    var second = habit("habit-2", Instant.parse("2026-04-11T10:00:00Z"));
    when(habitRepository.findSyncPageForUser("user-1", null, null, 3)).thenReturn(List.of(first, second));

    var page = resource.findPage(null, 2);

    assertEquals(2, page.items().size());
    assertNull(page.nextCursor());
    verify(habitRepository).findSyncPageForUser("user-1", null, null, 3);
  }

  @Test
  void shouldRejectInvalidLimitAndCursor() {
    assertThrows(BadRequestException.class, () -> resource.findPage(null, 0));
    assertThrows(BadRequestException.class, () -> resource.findPage("not-a-cursor", 2));
  }

  private HabitPageResource resource() {
    var currentUserContext = new CurrentUserContext();
    currentUserContext.setUser(new CurrentUser("user-1", "user@example.test"));
    return new HabitPageResource(habitRepository, Mappers.getMapper(HabitMapper.class), currentUserContext);
  }

  private HabitEntity habit(String id, Instant updatedAt) {
    var habit = new HabitEntity();
    habit.setId(id);
    habit.setUserId("user-1");
    habit.setName("Read");
    habit.setColor(HabitColor.BLUE);
    habit.setIcon("book");
    habit.setFrequency(HabitFrequency.DAILY);
    habit.setTargetStreak(1);
    habit.setDailyTarget(1);
    habit.setType(HabitType.POSITIVE);
    habit.setSortOrder(BigInteger.ONE);
    habit.setAuditTimestamps(updatedAt, updatedAt);
    return habit;
  }
}
