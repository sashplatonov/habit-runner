import type { HabitFrequency, HabitSchedule, WeekOfMonth } from './habit.js';

const WEEKDAY_ORDER = [1, 2, 3, 4, 5, 6, 0];
const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function formatOrdinal(value: number): string {
  if (value === 1) {
    return '1st';
  }
  if (value === 2) {
    return '2nd';
  }
  if (value === 3) {
    return '3rd';
  }
  return `${value}th`;
}

type ScheduleCandidate = Partial<HabitSchedule> & Record<string, unknown>;

type ScheduleBuilder = (candidate: ScheduleCandidate) => HabitSchedule | undefined;

function normalizeWeekdays(value?: unknown): number[] | undefined {
  if (!Array.isArray(value)) {
    return undefined;
  }
  const weekdays = value
    .map((item) => Number(item))
    .filter((day) => Number.isFinite(day) && day >= 0 && day <= 6)
    .map((day) => Math.trunc(day));
  const unique = Array.from(new Set(weekdays));
  const sorted = unique.sort((a, b) => WEEKDAY_ORDER.indexOf(a) - WEEKDAY_ORDER.indexOf(b));
  return sorted.length === 0 ? undefined : sorted;
}

function normalizeWeeksOfMonth(value?: unknown): WeekOfMonth[] | undefined {
  if (!Array.isArray(value)) {
    return undefined;
  }
  const allowed: WeekOfMonth[] = [1, 2, 3, 4, 'last'];
  const weeks = value
    .map((entry) => entry === 'last' ? 'last' : Number(entry))
    .filter((week): week is WeekOfMonth => allowed.includes(week as WeekOfMonth));
  const unique = Array.from(new Set(weeks));
  return unique.length === 0 ? undefined : unique;
}

const scheduleBuilders: Record<HabitSchedule['type'], ScheduleBuilder> = {
  daily: () => ({ type: 'daily' }),
  weekly_days: (candidate) => {
    const weekdays = normalizeWeekdays(candidate.weekdays);
    if (!weekdays) { return undefined; }
    return { type: 'weekly_days', weekdays };
  },
  weekly_quota: (candidate) => {
    const timesPerWeek = Number(candidate.timesPerWeek);
    if (!Number.isFinite(timesPerWeek) || timesPerWeek <= 0) { return undefined; }
    const weekdays = normalizeWeekdays(candidate.weekdays);
    return { type: 'weekly_quota', timesPerWeek: Math.trunc(timesPerWeek), weekdays: weekdays ?? undefined };
  },
  monthly_weeks: (candidate) => {
    const weeksOfMonth = normalizeWeeksOfMonth(candidate.weeksOfMonth);
    const weekdays = normalizeWeekdays(candidate.weekdays);
    if (!weeksOfMonth || !weekdays) { return undefined; }
    return { type: 'monthly_weeks', weeksOfMonth, weekdays };
  },
  monthly_quota: (candidate) => {
    const timesPerMonth = Number(candidate.timesPerMonth);
    if (!Number.isFinite(timesPerMonth) || timesPerMonth <= 0) { return undefined; }
    const weekdays = normalizeWeekdays(candidate.weekdays);
    return { type: 'monthly_quota', timesPerMonth: Math.trunc(timesPerMonth), weekdays: weekdays ?? undefined };
  }
};

export function normalizeSchedule(value?: unknown): HabitSchedule | undefined {
  if (!value || typeof value !== 'object') {
    return undefined;
  }
  const candidate = value as ScheduleCandidate;
  const builder = candidate.type ? scheduleBuilders[candidate.type as HabitSchedule['type']] : undefined;
  return builder ? builder(candidate) : undefined;
}

const LEGACY_WEEKDAY_MAP: Record<HabitFrequency, number[] | undefined> = {
  daily: undefined,
  weekdays: [1, 2, 3, 4, 5],
  weekends: [0, 6],
  custom: undefined
};

export function scheduleFromLegacy(frequency: HabitFrequency, customDays?: number[]): HabitSchedule {
  if (frequency === 'daily') {
    return { type: 'daily' };
  }
  if (frequency === 'weekdays') {
    return { type: 'weekly_days', weekdays: LEGACY_WEEKDAY_MAP.weekdays! };
  }
  if (frequency === 'weekends') {
    return { type: 'weekly_days', weekdays: LEGACY_WEEKDAY_MAP.weekends! };
  }
  const weekdays = normalizeWeekdays(customDays);
  if (weekdays) {
    return { type: 'weekly_days', weekdays };
  }
  return { type: 'daily' };
}

export function describeSchedule(schedule?: HabitSchedule | null): string {
  if (!schedule) {
    return 'Daily';
  }
  switch (schedule.type) {
    case 'daily':
      return 'Daily';
    case 'weekly_days':
      return `Every ${schedule.weekdays.map((day) => DAY_NAMES[day]).join(', ')}`;
    case 'weekly_quota':
      return `${schedule.timesPerWeek}x a week` + (schedule.weekdays ? ` on ${schedule.weekdays.map((day) => DAY_NAMES[day]).join(', ')}` : '');
    case 'monthly_weeks':
      return `${schedule.weeksOfMonth.map((week) => week === 'last' ? 'Last' : formatOrdinal(week)).join(', ')} week${schedule.weeksOfMonth.length > 1 ? 's' : ''} on ${schedule.weekdays.map((day) => DAY_NAMES[day]).join(', ')}`;
    case 'monthly_quota':
      return `${schedule.timesPerMonth}x a month` + (schedule.weekdays ? ` on ${schedule.weekdays.map((day) => DAY_NAMES[day]).join(', ')}` : '');
  }
}
