import type { Habit } from '@/types/habit';
import type { HabitEntity } from './db';
import { normalizeSchedule, scheduleFromLegacy } from '@habbit-runner/shared';

export function normalizeStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter((entry): entry is string => typeof entry === 'string');
}

export function normalizeNumberArray(value: unknown): number[] | undefined {
  if (!Array.isArray(value)) {
    return undefined;
  }

  return value.filter((entry): entry is number => typeof entry === 'number' && Number.isFinite(entry));
}

export function normalizeCompletions(value: unknown): Record<string, number> {
  if (!value || typeof value !== 'object') {
    return {};
  }

  const entries = Object.entries(value).flatMap(([date, count]) => {
    if (typeof count !== 'number' || !Number.isFinite(count)) {
      return [];
    }

    return [[date, Math.max(0, Math.trunc(count))] as const];
  });

  return Object.fromEntries(entries);
}

export function habitEntityToDomain(entity: HabitEntity): Habit {
  const customDays = normalizeNumberArray(entity.customDays);

  return {
    id: entity.id,
    name: entity.name,
    description: entity.description ?? '',
    color: entity.color as Habit['color'],
    icon: entity.icon,
    frequency: entity.frequency as Habit['frequency'],
    customDays,
    targetStreak: entity.targetStreak,
    dailyTarget: Math.max(1, Math.trunc(entity.dailyTarget ?? 1)),
    tags: normalizeStringArray(entity.tags),
    completions: normalizeCompletions(entity.completions),
    freezeDays: normalizeStringArray(entity.freezeDays),
    sortOrder: entity.sortOrder ?? Date.parse(entity.createdAt),
    reminderTime: entity.reminderTime ?? undefined,
    reminderEnabled: entity.reminderEnabled ?? true,
    createdAt: entity.createdAt,
    updatedAt: entity.updatedAt,
    version: entity.version,
    archived: entity.archived ?? false,
    type: entity.type ?? 'positive',
    schedule:
      normalizeSchedule(entity.schedule) ??
      scheduleFromLegacy(entity.frequency as Habit['frequency'], customDays)
  };
}