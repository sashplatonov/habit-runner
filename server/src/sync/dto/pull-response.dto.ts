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
