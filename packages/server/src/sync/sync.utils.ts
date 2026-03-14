import type {
  HabitDto,
  CheckinDto,
  TombstoneDto
} from './dto/pull-response.dto';
import type { Cursor } from './sync.types';
import { HabitFrequency, normalizeSchedule, scheduleFromLegacy, toSyncISO } from '@habbit-runner/shared';

export const parseCursor = (cursor?: string): Cursor | undefined => {
  if (!cursor) {return undefined;}
  try {
    const parsed = JSON.parse(cursor) as Cursor;
    if (!parsed?.updatedAt || !parsed?.id) {return undefined;}
    return { updatedAt: new Date(parsed.updatedAt), id: parsed.id };
  } catch {
    return undefined;
  }
};

export const buildCursorClause = (
  cursor: Cursor,
  field: 'updatedAt' | 'deletedAt'
) => ({
  OR: [
    { [field]: { gt: cursor.updatedAt } },
    {
      [field]: { equals: cursor.updatedAt },
      id: { gt: cursor.id }
    }
  ]
});

export const calculateNextCursor = (
  rows: { updatedAt: Date; id: string }[]
): string | undefined => {
  if (rows.length === 0) {return undefined;}
  const latest = rows.reduce((max, current) => {
    if (current.updatedAt.getTime() > max.updatedAt.getTime()) {return current;}
    if (current.updatedAt.getTime() < max.updatedAt.getTime()) {return max;}
    return current.id > max.id ? current : max;
  });
  return JSON.stringify({ updatedAt: toSyncISO(latest.updatedAt), id: latest.id });
};

export const serializeHabit = (habit: {
  id: string;
  name: string;
  description: string | null;
  color: string;
  icon: string;
  frequency: string;
  customDays: unknown;
  schedule?: unknown;
  targetStreak: number;
  dailyTarget: number;
  tags: unknown;
  archived: boolean;
  sortOrder: number | bigint;
  reminderTime: string | null;
  reminderEnabled: boolean;
  createdAt: Date;
  updatedAt: Date;
  version: number;
  difficulty?: number;
  type?: string;
}): HabitDto => ({
  id: habit.id,
  name: habit.name,
  description: habit.description ?? '',
  color: habit.color,
  icon: habit.icon,
  frequency: habit.frequency,
  customDays: Array.isArray(habit.customDays) ? habit.customDays as number[] : undefined,
  targetStreak: habit.targetStreak,
  dailyTarget: habit.dailyTarget,
  tags: Array.isArray(habit.tags) ? habit.tags as string[] : [],
  archived: habit.archived,
  sortOrder: Number(habit.sortOrder ?? 0),
  reminderTime: habit.reminderTime ?? undefined,
  reminderEnabled: habit.reminderEnabled,
  schedule:
    normalizeSchedule(habit.schedule) ??
    scheduleFromLegacy(
      habit.frequency as HabitFrequency,
      Array.isArray(habit.customDays) ? habit.customDays.map((day) => Number(day)).filter((day) => Number.isFinite(day)) as number[] : undefined
    ),
  createdAt: toSyncISO(habit.createdAt),
  updatedAt: toSyncISO(habit.updatedAt),
  version: habit.version,
  difficulty: habit.difficulty,
  type: habit.type
});

export const serializeCheckin = (checkin: {
  id: string;
  habitId: string;
  date: Date;
  done: boolean;
  count: number;
  updatedAt: Date;
  version: number;
}): CheckinDto => ({
  id: checkin.id,
  habitId: checkin.habitId,
  date: toSyncISO(checkin.date),
  done: checkin.done,
  count: checkin.count,
  updatedAt: toSyncISO(checkin.updatedAt),
  version: checkin.version
});

export const serializeTombstone = (tombstone: {
  id: string;
  entity: string;
  entityId: string;
  deletedAt: Date;
  version: number;
}): TombstoneDto => ({
  id: tombstone.id,
  entity: tombstone.entity,
  entityId: tombstone.entityId,
  deletedAt: toSyncISO(tombstone.deletedAt),
  version: tombstone.version
});

export const normalizeDate = (value?: string): Date => {
  if (!value) {return new Date();}
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {return new Date();}
  return parsed;
};

export const isUniqueConstraintError = (error: unknown): boolean => {
  if (!error || typeof error !== 'object') {return false;}
  if (!('code' in error)) {return false;}
  return (error as { code?: string }).code === 'P2002';
};

export const normalizeTags = (value: unknown): unknown => {
  if (value === undefined || value === null) {return undefined;}
  return value;
};

export const normalizeCustomDays = (value: unknown): number[] | undefined => {
  if (!Array.isArray(value)) {return undefined;}
  const days = value
    .filter((day) => typeof day === 'number')
    .map((day) => Math.trunc(day))
    .filter((day) => day >= 0 && day <= 6);
  return days.length > 0 ? Array.from(new Set(days)) : undefined;
};

export const normalizeReminderEnabled = (
  value: unknown,
  fallback?: boolean
): boolean => {
  if (typeof value === 'boolean') {
    return value;
  }
  if (typeof fallback === 'boolean') {
    return fallback;
  }
  return true;
};

export const normalizeSortOrder = (value?: unknown): number | undefined => {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    return undefined;
  }
  return Math.trunc(value);
};

export const normalizeReminderTime = (value?: string | null): string | null => {
  if (!value || typeof value !== 'string') {
    return null;
  }
  if (!/^\d{2}:\d{2}$/.test(value)) {
    return null;
  }
  const [hours, minutes] = value.split(':').map((segment) => Number(segment));
  if (
    Number.isNaN(hours) ||
    Number.isNaN(minutes) ||
    hours < 0 ||
    hours > 23 ||
    minutes < 0 ||
    minutes > 59
  ) {
    return null;
  }
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
};
