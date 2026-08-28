import { expect, test } from 'vitest';
import type { Habit } from '../../src/types/habit.js';
import {
  calculateScheduledCompletionRate,
  calculateScheduledStreak,
  countCompletedDaysInRange,
  isMandatoryForCalendarDate,
  isMandatoryToday
} from '../../src/lib/habits/schedule.js';
import { formatDate } from '../../src/lib/habits/habitStats.js';

function createHabit(overrides: Partial<Habit> = {}): Habit {
  return {
    id: 'habit',
    name: 'Habit',
    description: '',
    color: 'blue',
    icon: '⚡',
    tags: [],
    frequency: 'daily',
    schedule: { type: 'daily' },
    targetStreak: 21,
    dailyTarget: 1,
    type: 'positive',
    completions: {},
    freezeDays: [],
    createdAt: new Date().toISOString(),
    archived: false,
    sortOrder: 0,
    ...overrides
  };
}

function isoDate(value: string) {
  return formatDate(new Date(value));
}

function tzDate(value: string, timeZone: string) {
  return formatDate(new Date(value), timeZone);
}

test('calculateScheduledStreak matches consecutive scheduled days', () => {
  const habit = createHabit({
    completions: {
      [isoDate('2026-03-06T00:00:00Z')]: 1,
      [isoDate('2026-03-05T00:00:00Z')]: 1,
      [isoDate('2026-03-04T00:00:00Z')]: 1
    }
  });

  const result = calculateScheduledStreak(habit, habit.completions, new Date('2026-03-06T00:00:00Z'));
  expect(result).toEqual({ current: 3, longest: 3 });
});

test('calculateScheduledCompletionRate covers daily schedule window', () => {
  const habit = createHabit({
    completions: {
      [isoDate('2026-03-01T00:00:00Z')]: 1,
      [isoDate('2026-03-03T00:00:00Z')]: 1,
      [isoDate('2026-03-04T00:00:00Z')]: 1
    }
  });

  const rate = calculateScheduledCompletionRate(habit, habit.completions, new Date('2026-03-04T00:00:00Z'));
  expect(rate).toBe(10);
});

test('calculateScheduledStreak and rate handle weekly quota schedules', () => {
  const habit = createHabit({
    schedule: { type: 'weekly_quota', timesPerWeek: 2, weekdays: [1, 2] },
    completions: {
      [isoDate('2026-03-02T00:00:00Z')]: 1,
      [isoDate('2026-03-03T00:00:00Z')]: 1,
      [isoDate('2026-02-23T00:00:00Z')]: 1,
      [isoDate('2026-02-24T00:00:00Z')]: 1,
      [isoDate('2026-02-16T00:00:00Z')]: 1,
      [isoDate('2026-02-17T00:00:00Z')]: 1
    }
  });

  const reference = new Date('2026-03-07T00:00:00Z');
  const streak = calculateScheduledStreak(habit, habit.completions, reference);
  const rate = calculateScheduledCompletionRate(habit, habit.completions, reference);

  expect(streak).toEqual({ current: 3, longest: 3 });
  expect(rate).toBe(25);
});

test('calculateScheduledStreak: weekly_quota keeps last completed week while current week is still in progress', () => {
  const habit = createHabit({
    schedule: { type: 'weekly_quota', timesPerWeek: 2, weekdays: [1, 2] },
    completions: {
      [isoDate('2026-03-02T00:00:00Z')]: 1,
      [isoDate('2026-03-03T00:00:00Z')]: 1
    }
  });

  const result = calculateScheduledStreak(habit, habit.completions, new Date('2026-03-10T00:00:00Z'));
  expect(result).toEqual({ current: 1, longest: 1 });
});

test('calculateScheduledStreak: weekly_quota counts the current week once quota is already met before week end', () => {
  const habit = createHabit({
    schedule: { type: 'weekly_quota', timesPerWeek: 2, weekdays: [1, 2] },
    completions: {
      [isoDate('2026-03-02T00:00:00Z')]: 1,
      [isoDate('2026-03-03T00:00:00Z')]: 1,
      [isoDate('2026-03-09T00:00:00Z')]: 1,
      [isoDate('2026-03-10T00:00:00Z')]: 1
    }
  });

  const result = calculateScheduledStreak(habit, habit.completions, new Date('2026-03-10T00:00:00Z'));
  expect(result).toEqual({ current: 2, longest: 2 });
});

test('calculateScheduledStreak: monthly_quota keeps last completed month while current month is still in progress', () => {
  const habit = createHabit({
    schedule: { type: 'monthly_quota', timesPerMonth: 2 },
    completions: {
      [isoDate('2026-02-02T00:00:00Z')]: 1,
      [isoDate('2026-02-18T00:00:00Z')]: 1
    }
  });

  const result = calculateScheduledStreak(habit, habit.completions, new Date('2026-03-10T00:00:00Z'));
  expect(result).toEqual({ current: 1, longest: 1 });
});

test('isMandatoryToday ignores meet quota when checkin uses sync ISO without milliseconds', () => {
  const habit = createHabit({
    schedule: { type: 'weekly_quota', timesPerWeek: 1 },
    completions: {
      '2026-03-19T00:00:00Z': 1
    }
  });

  const result = isMandatoryToday(habit, new Date('2026-03-20T00:00:00Z'));
  expect(result).toBe(false);
});

test('countCompletedDaysInRange uses the provided timezone day boundaries', () => {
  const timeZone = 'America/Los_Angeles';
  const completions = {
    [tzDate('2026-03-05T08:30:00Z', timeZone)]: 1,
    [tzDate('2026-03-06T08:30:00Z', timeZone)]: 1
  };

  const count = countCompletedDaysInRange(
    completions,
    new Date('2026-03-05T08:00:00Z'),
    new Date('2026-03-06T08:00:00Z'),
    1,
    undefined,
    timeZone
  );

  expect(count).toBe(2);
});

test('isMandatoryToday respects the user timezone around UTC day changes', () => {
  const timeZone = 'America/Los_Angeles';
  const habit = createHabit({
    schedule: { type: 'weekly_quota', timesPerWeek: 1 },
    completions: {
      [tzDate('2026-03-20T06:30:00Z', timeZone)]: 1
    }
  });

  const result = isMandatoryToday(habit, new Date('2026-03-20T08:30:00Z'), timeZone);
  expect(result).toBe(false);
});

test('isMandatoryForCalendarDate evaluates quota against the explicit calendar date', () => {
  const habit = createHabit({
    schedule: { type: 'weekly_quota', timesPerWeek: 1, weekdays: [5] },
    completions: { '2026-03-20T00:00:00Z': 1 }
  });

  expect(isMandatoryForCalendarDate(habit, '2026-03-20', 'America/Los_Angeles')).toBe(false);
});

// Reference dates (UTC):
// 2026-03-13 = Friday (UTC day 5), week 3 of March
// 2026-03-14 = Saturday (UTC day 6)
// 2026-03-16 = Monday (UTC day 1)
// 2026-03-17 = Tuesday (UTC day 2)
// 2026-03-18 = Wednesday (UTC day 3)
// 2026-03-19 = Thursday (UTC day 4)
// 2026-03-20 = Friday (UTC day 5), week 4 of March

// ── daily ──────────────────────────────────────────────────────────────────

test('isMandatoryToday: daily — always mandatory', () => {
  const habit = createHabit({ schedule: { type: 'daily' } });
  expect(isMandatoryToday(habit, new Date('2026-03-20T00:00:00Z'), 'UTC')).toBe(true);
});

test('isMandatoryToday: daily — mandatory even when completions exist (completion tracking is external)', () => {
  const habit = createHabit({
    schedule: { type: 'daily' },
    completions: { '2026-03-20T00:00:00Z': 5 }
  });
  expect(isMandatoryToday(habit, new Date('2026-03-20T00:00:00Z'), 'UTC')).toBe(true);
});

// ── weekly_days ────────────────────────────────────────────────────────────

test('isMandatoryToday: weekly_days — mandatory on a scheduled weekday', () => {
  const habit = createHabit({ schedule: { type: 'weekly_days', weekdays: [5] } });
  expect(isMandatoryToday(habit, new Date('2026-03-20T00:00:00Z'), 'UTC')).toBe(true);
});

test('isMandatoryToday: weekly_days — not mandatory on a non-scheduled weekday', () => {
  const habit = createHabit({ schedule: { type: 'weekly_days', weekdays: [5] } });
  expect(isMandatoryToday(habit, new Date('2026-03-19T00:00:00Z'), 'UTC')).toBe(false);
});

test('isMandatoryToday: weekly_days — mandatory on any matching day in a multi-day schedule', () => {
  const habit = createHabit({ schedule: { type: 'weekly_days', weekdays: [1, 3, 5] } });
  expect(isMandatoryToday(habit, new Date('2026-03-18T00:00:00Z'), 'UTC')).toBe(true); // Wednesday
  expect(isMandatoryToday(habit, new Date('2026-03-17T00:00:00Z'), 'UTC')).toBe(false); // Tuesday not in list
});

// ── weekly_quota ───────────────────────────────────────────────────────────

test('isMandatoryToday: weekly_quota — no completions → mandatory', () => {
  const habit = createHabit({ schedule: { type: 'weekly_quota', timesPerWeek: 1 } });
  expect(isMandatoryToday(habit, new Date('2026-03-20T00:00:00Z'), 'UTC')).toBe(true);
});

test('isMandatoryToday: weekly_quota — completed yesterday → not mandatory', () => {
  const habit = createHabit({
    schedule: { type: 'weekly_quota', timesPerWeek: 1 },
    completions: { '2026-03-19T00:00:00Z': 1 }
  });
  expect(isMandatoryToday(habit, new Date('2026-03-20T00:00:00Z'), 'UTC')).toBe(false);
});

test('isMandatoryToday: weekly_quota — completion on non-scheduled weekday counts toward quota', () => {
  // weekdays=[5] means only Fridays are shown as scheduled, but Thursday completion still counts
  const habit = createHabit({
    schedule: { type: 'weekly_quota', timesPerWeek: 1, weekdays: [5] },
    completions: { '2026-03-19T00:00:00Z': 1 } // Thursday
  });
  expect(isMandatoryToday(habit, new Date('2026-03-20T00:00:00Z'), 'UTC')).toBe(false);
});

test('isMandatoryToday: weekly_quota — not mandatory on a non-scheduled weekday', () => {
  const habit = createHabit({
    schedule: { type: 'weekly_quota', timesPerWeek: 1, weekdays: [5] }
  });
  expect(isMandatoryToday(habit, new Date('2026-03-19T00:00:00Z'), 'UTC')).toBe(false); // Thursday
});

test('isMandatoryToday: weekly_quota — timesPerWeek=2, only 1 completion → still mandatory', () => {
  const habit = createHabit({
    schedule: { type: 'weekly_quota', timesPerWeek: 2 },
    completions: { '2026-03-19T00:00:00Z': 1 }
  });
  expect(isMandatoryToday(habit, new Date('2026-03-20T00:00:00Z'), 'UTC')).toBe(true);
});

test('isMandatoryToday: weekly_quota — timesPerWeek=2, 2 completions → not mandatory', () => {
  const habit = createHabit({
    schedule: { type: 'weekly_quota', timesPerWeek: 2 },
    completions: {
      '2026-03-18T00:00:00Z': 1,
      '2026-03-19T00:00:00Z': 1
    }
  });
  expect(isMandatoryToday(habit, new Date('2026-03-20T00:00:00Z'), 'UTC')).toBe(false);
});

test('isMandatoryToday: weekly_quota — completion older than 7 days does not count', () => {
  // Window is [today-6, today] = [2026-03-14, 2026-03-20]; March 13 is outside
  const habit = createHabit({
    schedule: { type: 'weekly_quota', timesPerWeek: 1 },
    completions: { '2026-03-13T00:00:00Z': 1 }
  });
  expect(isMandatoryToday(habit, new Date('2026-03-20T00:00:00Z'), 'UTC')).toBe(true);
});

test('isMandatoryToday: weekly_quota — completion on first day of window counts', () => {
  // Window start = today-6 = 2026-03-14
  const habit = createHabit({
    schedule: { type: 'weekly_quota', timesPerWeek: 1 },
    completions: { '2026-03-14T00:00:00Z': 1 }
  });
  expect(isMandatoryToday(habit, new Date('2026-03-20T00:00:00Z'), 'UTC')).toBe(false);
});

// ── monthly_quota ──────────────────────────────────────────────────────────

test('isMandatoryToday: monthly_quota — no completions → mandatory', () => {
  const habit = createHabit({ schedule: { type: 'monthly_quota', timesPerMonth: 1 } });
  expect(isMandatoryToday(habit, new Date('2026-03-20T00:00:00Z'), 'UTC')).toBe(true);
});

test('isMandatoryToday: monthly_quota — completed within 30-day window → not mandatory', () => {
  const habit = createHabit({
    schedule: { type: 'monthly_quota', timesPerMonth: 1 },
    completions: { '2026-03-15T00:00:00Z': 1 }
  });
  expect(isMandatoryToday(habit, new Date('2026-03-20T00:00:00Z'), 'UTC')).toBe(false);
});

test('isMandatoryToday: monthly_quota — timesPerMonth=3, only 2 completions → mandatory', () => {
  const habit = createHabit({
    schedule: { type: 'monthly_quota', timesPerMonth: 3 },
    completions: {
      '2026-03-10T00:00:00Z': 1,
      '2026-03-15T00:00:00Z': 1
    }
  });
  expect(isMandatoryToday(habit, new Date('2026-03-20T00:00:00Z'), 'UTC')).toBe(true);
});

test('isMandatoryToday: monthly_quota — timesPerMonth=3, 3 completions → not mandatory', () => {
  const habit = createHabit({
    schedule: { type: 'monthly_quota', timesPerMonth: 3 },
    completions: {
      '2026-03-05T00:00:00Z': 1,
      '2026-03-10T00:00:00Z': 1,
      '2026-03-15T00:00:00Z': 1
    }
  });
  expect(isMandatoryToday(habit, new Date('2026-03-20T00:00:00Z'), 'UTC')).toBe(false);
});

test('isMandatoryToday: monthly_quota — completion on non-scheduled weekday counts toward quota', () => {
  // weekdays=[5] — only Fridays are shown, but Thursday completion counts
  const habit = createHabit({
    schedule: { type: 'monthly_quota', timesPerMonth: 1, weekdays: [5] },
    completions: { '2026-03-19T00:00:00Z': 1 } // Thursday
  });
  expect(isMandatoryToday(habit, new Date('2026-03-20T00:00:00Z'), 'UTC')).toBe(false);
});

test('isMandatoryToday: monthly_quota — not mandatory on a non-scheduled weekday', () => {
  const habit = createHabit({
    schedule: { type: 'monthly_quota', timesPerMonth: 1, weekdays: [5] }
  });
  expect(isMandatoryToday(habit, new Date('2026-03-19T00:00:00Z'), 'UTC')).toBe(false); // Thursday
});

test('isMandatoryToday: monthly_quota — completion older than 30 days does not count', () => {
  // Window is [today-29, today] = [2026-02-19, 2026-03-20]; Feb 18 is outside
  const habit = createHabit({
    schedule: { type: 'monthly_quota', timesPerMonth: 1 },
    completions: { '2026-02-18T00:00:00Z': 1 }
  });
  expect(isMandatoryToday(habit, new Date('2026-03-20T00:00:00Z'), 'UTC')).toBe(true);
});

test('isMandatoryToday: monthly_quota — completion on first day of window counts', () => {
  // Window start = today-29 = 2026-02-19
  const habit = createHabit({
    schedule: { type: 'monthly_quota', timesPerMonth: 1 },
    completions: { '2026-02-19T00:00:00Z': 1 }
  });
  expect(isMandatoryToday(habit, new Date('2026-03-20T00:00:00Z'), 'UTC')).toBe(false);
});

// ── monthly_weeks ──────────────────────────────────────────────────────────
// March 2026: starts on Sunday (UTC day 0), offset=6
// 2026-03-13 = Friday (day 5), week 3  (adjusted=19, ceil(19/7)=3)
// 2026-03-20 = Friday (day 5), week 4  (adjusted=26, ceil(26/7)=4)

test('isMandatoryToday: monthly_weeks — mandatory when week and weekday match', () => {
  const habit = createHabit({
    schedule: { type: 'monthly_weeks', weeksOfMonth: [4], weekdays: [5] }
  });
  expect(isMandatoryToday(habit, new Date('2026-03-20T00:00:00Z'), 'UTC')).toBe(true);
});

test('isMandatoryToday: monthly_weeks — not mandatory when week does not match', () => {
  const habit = createHabit({
    schedule: { type: 'monthly_weeks', weeksOfMonth: [3], weekdays: [5] }
  });
  expect(isMandatoryToday(habit, new Date('2026-03-20T00:00:00Z'), 'UTC')).toBe(false); // week 4, not 3
});

test('isMandatoryToday: monthly_weeks — not mandatory when weekday does not match', () => {
  const habit = createHabit({
    schedule: { type: 'monthly_weeks', weeksOfMonth: [4], weekdays: [1] } // Mondays in week 4
  });
  expect(isMandatoryToday(habit, new Date('2026-03-20T00:00:00Z'), 'UTC')).toBe(false); // Friday, not Monday
});

test('isMandatoryToday: monthly_weeks — mandatory on correct week-3 Friday', () => {
  const habit = createHabit({
    schedule: { type: 'monthly_weeks', weeksOfMonth: [3], weekdays: [5] }
  });
  expect(isMandatoryToday(habit, new Date('2026-03-13T00:00:00Z'), 'UTC')).toBe(true);
});

test('isMandatoryToday: monthly_weeks — multiple weeks, mandatory on any matching week', () => {
  const habit = createHabit({
    schedule: { type: 'monthly_weeks', weeksOfMonth: [2, 4], weekdays: [5] }
  });
  expect(isMandatoryToday(habit, new Date('2026-03-20T00:00:00Z'), 'UTC')).toBe(true); // week 4 ✓
  expect(isMandatoryToday(habit, new Date('2026-03-13T00:00:00Z'), 'UTC')).toBe(false); // week 3, not in [2,4]
});

// ── streaks for non-daily schedules ─────────────────────────────────────────

test('calculateScheduledStreak: weekly_days — skips unscheduled days and keeps streak', () => {
  const habit = createHabit({
    schedule: { type: 'weekly_days', weekdays: [1, 3, 5] }, // Mon, Wed, Fri
    completions: {
      [isoDate('2026-03-16T00:00:00Z')]: 1, // Mon
      [isoDate('2026-03-18T00:00:00Z')]: 1, // Wed
      [isoDate('2026-03-20T00:00:00Z')]: 1 // Fri
    }
  });

  const result = calculateScheduledStreak(habit, habit.completions, new Date('2026-03-20T00:00:00Z'));
  expect(result).toEqual({ current: 3, longest: 3 });
});

test('calculateScheduledStreak: weekly_days — missing today (scheduled) does not count today but preserves previous streak', () => {
  const habit = createHabit({
    schedule: { type: 'weekly_days', weekdays: [1, 3, 5] }, // Mon, Wed, Fri
    completions: {
      [isoDate('2026-03-16T00:00:00Z')]: 1, // Mon
      [isoDate('2026-03-18T00:00:00Z')]: 1 // Wed
      // missing Fri (2026-03-20)
    }
  });

  const result = calculateScheduledStreak(habit, habit.completions, new Date('2026-03-20T00:00:00Z'));
  expect(result.current).toBe(2);
});

test('calculateScheduledStreak: freezeDays are treated as skipped and do not break streaks', () => {
  const calendarKey = isoDate('2026-03-20T00:00:00Z').slice(0, 10);
  const habit = createHabit({
    schedule: { type: 'weekly_days', weekdays: [1, 3, 5] },
    completions: {
      [isoDate('2026-03-16T00:00:00Z')]: 1, // Mon
      [isoDate('2026-03-18T00:00:00Z')]: 1 // Wed
    },
    freezeDays: [calendarKey]
  });

  // Today (2026-03-20) is frozen — streak should remain 2
  const result = calculateScheduledStreak(habit, habit.completions, new Date('2026-03-20T00:00:00Z'));
  expect(result.current).toBe(2);
});
