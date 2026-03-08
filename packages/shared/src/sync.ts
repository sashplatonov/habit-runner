export const SYNC_ENTITY_VALUES = ['habit', 'checkin'] as const;
export type SyncEntity = (typeof SYNC_ENTITY_VALUES)[number];

export const SYNC_OP_TYPE_VALUES = ['upsert', 'delete'] as const;
export type SyncOpType = (typeof SYNC_OP_TYPE_VALUES)[number];

export interface HabitDto {
  id: string;
  name: string;
  description?: string | null;
  color: string;
  icon: string;
  frequency: string;
  customDays?: unknown;
  targetStreak: number;
  tags?: unknown;
  archived: boolean;
  createdAt: string;
  updatedAt: string;
  version: number;
  sortOrder: number;
  reminderTime?: string;
  reminderEnabled?: boolean;
}

export interface CheckinDto {
  id: string;
  habitId: string;
  date: string;
  done: boolean;
  updatedAt: string;
  version: number;
}

export interface TombstoneDto {
  id: string;
  entity: string;
  entityId: string;
  deletedAt: string;
  version: number;
}

export interface PullResponseDto {
  habits: HabitDto[];
  checkins: CheckinDto[];
  tombstones: TombstoneDto[];
  nextCursor?: string;
  serverTime: string;
}

export interface PushConflict {
  opId: string;
  reason: string;
  serverValue?: unknown;
}

export interface PushResponseDto {
  applied: string[];
  conflicts: PushConflict[];
  serverTime: string;
}

export interface SyncOpDto {
  id: string;
  entity: SyncEntity;
  type: SyncOpType;
  payload: Record<string, unknown>;
  clientTime?: string;
}
