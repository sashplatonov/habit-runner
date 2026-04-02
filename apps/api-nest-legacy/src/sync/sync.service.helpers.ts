import type { ExistingHabitRecord, HabitPayload } from './sync.types';
import type { PushConflict } from './dto/push-request.dto';
import {
  normalizeCustomDays,
  normalizeFreezeDays,
  normalizeReminderEnabled,
  normalizeReminderTime,
  normalizeSortOrder,
  normalizeTags
} from './sync.utils';
import { HABIT_FREQUENCIES, HabitFrequency, HabitSchedule, normalizeSchedule, scheduleFromLegacy } from '@habbit-runner/shared';

export function hasHabitOwnershipConflict(
  existing: ExistingHabitRecord | null,
  userId: string
): boolean {
  return Boolean(existing && existing.userId !== userId);
}

export function hasNewerHabitConflict(
  existing: ExistingHabitRecord | null,
  timestamp: Date,
  opId: string,
  conflicts: PushConflict[]
): boolean {
  if (!existing || new Date(existing.updatedAt).getTime() <= timestamp.getTime()) {
    return false;
  }

  conflicts.push({
    opId,
    reason: 'server already has newer habit',
    serverValue: {
      version: existing.version,
      updatedAt: existing.updatedAt
    }
  });
  return true;
}

export function buildHabitWriteValues(
  payload: HabitPayload,
  existing: ExistingHabitRecord | null
): {
  nextVersion: number;
  sortOrder: bigint;
  dailyTarget: number;
  reminderTime: string | null;
  reminderEnabled: boolean;
  tags: unknown;
  customDays: number[] | undefined;
  schedule: HabitSchedule;
  type: string;
  freezeDays: string[] | undefined;
} {
  return {
    nextVersion: resolveHabitVersion(existing, payload.version),
    sortOrder: resolveHabitSortOrder(existing, payload.sortOrder),
    dailyTarget: resolveHabitDailyTarget(existing, payload.dailyTarget),
    reminderTime: resolveHabitReminderTime(existing, payload.reminderTime),
    reminderEnabled: resolveHabitReminderEnabled(existing, payload.reminderEnabled),
    tags: normalizeTags(payload.tags),
    customDays: normalizeCustomDays(payload.customDays),
    schedule: resolveHabitSchedule(existing, payload),
    type: resolveHabitType(existing, payload.type),
    freezeDays: resolveHabitFreezeDays(existing, payload.freezeDays)
  };
}

function resolveHabitVersion(existing: ExistingHabitRecord | null, payloadVersion?: number): number {
  return Math.max(existing?.version ?? 0, payloadVersion ?? 0) + 1;
}

function resolveHabitSortOrder(existing: ExistingHabitRecord | null, payloadSortOrder?: number): bigint {
  const normalizedSortOrder = normalizeSortOrder(payloadSortOrder);
  if (typeof normalizedSortOrder === 'number') {
    return BigInt(normalizedSortOrder);
  }

  const existingSortOrder = existing?.sortOrder;
  if (typeof existingSortOrder === 'bigint') {
    return existingSortOrder;
  }
  if (typeof existingSortOrder === 'number') {
    return BigInt(Math.trunc(existingSortOrder));
  }

  return 0n;
}

function resolveHabitDailyTarget(
  existing: ExistingHabitRecord | null,
  payloadDailyTarget?: number
): number {
  if (typeof payloadDailyTarget === 'number' && Number.isFinite(payloadDailyTarget)) {
    return Math.max(1, Math.trunc(payloadDailyTarget));
  }
  return Math.max(1, existing?.dailyTarget ?? 1);
}

function resolveHabitReminderTime(
  existing: ExistingHabitRecord | null,
  payloadReminderTime?: string | null
): string | null {
  return normalizeReminderTime(payloadReminderTime ?? existing?.reminderTime);
}

function resolveHabitReminderEnabled(
  existing: ExistingHabitRecord | null,
  payloadReminderEnabled?: boolean
): boolean {
  return normalizeReminderEnabled(payloadReminderEnabled, existing?.reminderEnabled ?? true);
}

function resolveHabitSchedule(
  existing: ExistingHabitRecord | null,
  payload: HabitPayload
): HabitSchedule {
  const normalized = normalizeSchedule(payload.schedule);
  if (normalized) {
    return normalized;
  }
  if (existing?.schedule) {
    const inherited = normalizeSchedule(existing.schedule);
    if (inherited) {
      return inherited;
    }
  }
  const frequency = normalizeHabitFrequency(payload.frequency);
  return scheduleFromLegacy(frequency, normalizeCustomDays(payload.customDays));
}

function normalizeHabitFrequency(value: unknown): HabitFrequency {
  if (typeof value !== 'string') {
    return 'daily';
  }
  if ((HABIT_FREQUENCIES as readonly string[]).includes(value)) {
    return value as HabitFrequency;
  }
  return 'daily';
}

function resolveHabitType(existing: ExistingHabitRecord | null, payloadValue?: string): string {
  if (typeof payloadValue === 'string') {
    return payloadValue === 'negative' ? 'negative' : 'positive';
  }
  return existing?.type ?? 'positive';
}

function resolveHabitFreezeDays(existing: ExistingHabitRecord | null, payloadValue?: string[]): string[] | undefined {
  if (payloadValue !== undefined) {
    return normalizeFreezeDays(payloadValue) ?? [];
  }
  if (existing?.freezeDays) {
    const inheritedFreeze = normalizeFreezeDays(existing.freezeDays);
    if (inheritedFreeze !== undefined) {
      return inheritedFreeze;
    }
  }
  return undefined;
}
