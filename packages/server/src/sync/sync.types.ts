export interface Cursor {
  updatedAt: Date;
  id: string;
}

export interface HabitPayload {
  id: string;
  name: string;
  description?: string | null;
  color: string;
  icon: string;
  frequency: string;
  customDays?: unknown;
  targetStreak: number;
  dailyTarget?: number;
  tags?: unknown;
  archived?: boolean;
  version?: number;
  updatedAt?: string;
  createdAt?: string;
  sortOrder?: number;
  reminderTime?: string | null;
  reminderEnabled?: boolean;
}

export interface CheckinPayload {
  id?: string;
  habitId: string;
  date: string;
  done: boolean;
  count?: number;
  version?: number;
  updatedAt?: string;
}

export interface ExistingHabitRecord {
  userId: string;
  updatedAt: Date;
  version: number;
  sortOrder: number | bigint;
  dailyTarget: number;
  reminderTime: string | null;
  reminderEnabled: boolean;
}

export interface ParentHabitRecord {
  userId: string;
}

export interface ExistingCheckinRecord {
  updatedAt: Date;
  version: number;
}

export type TxClient = {
  syncOpLog: {
    create(args: { data: { opId: string } }): Promise<unknown>;
  };
  tombstone: {
    create(args: {
      data: {
        userId: string;
        entity: string;
        entityId: string;
        version: number;
      };
    }): Promise<unknown>;
  };
  habit: {
    findUnique(args: { where: { id: string }; select?: { userId: true } }): Promise<unknown>;
    upsert(args: {
      where: { id: string };
      create: Record<string, unknown>;
      update: Record<string, unknown>;
    }): Promise<unknown>;
    deleteMany(args: { where: { id?: string; userId: string } }): Promise<unknown>;
  };
  checkin: {
    findFirst(args: { where: { habitId: string; date: Date; userId: string } }): Promise<unknown>;
    upsert(args: {
      where: { habit_date_unique: { habitId: string; date: Date } };
      create: Record<string, unknown>;
      update: Record<string, unknown>;
    }): Promise<unknown>;
    deleteMany(args: { where: { habitId: string; userId: string; date?: Date } }): Promise<unknown>;
  };
};
