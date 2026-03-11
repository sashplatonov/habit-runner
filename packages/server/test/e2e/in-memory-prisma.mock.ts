import { randomUUID } from 'node:crypto';

type UserRecord = {
  id: string;
  email: string;
};

type RefreshTokenRecord = {
  token: string;
  userId: string;
  revoked: boolean;
  expiresAt: Date;
};

type HabitRecord = {
  id: string;
  userId: string;
  name: string;
  description: string | null;
  color: string;
  icon: string;
  frequency: string;
  customDays?: unknown;
  targetStreak: number;
  dailyTarget: number;
  tags: unknown;
  archived: boolean;
  createdAt: Date;
  updatedAt: Date;
  version: number;
};

type CheckinRecord = {
  id: string;
  habitId: string;
  userId: string;
  date: Date;
  done: boolean;
  count: number;
  updatedAt: Date;
  version: number;
};

type TombstoneRecord = {
  id: string;
  userId: string;
  entity: string;
  entityId: string;
  version: number;
  deletedAt: Date;
};

export class InMemoryPrismaMock {
  private users: UserRecord[] = [];
  private refreshTokens: RefreshTokenRecord[] = [];
  private habits: HabitRecord[] = [];
  private checkins: CheckinRecord[] = [];
  private tombstones: TombstoneRecord[] = [];
  private syncOpIds = new Set<string>();

  reset() {
    this.users = [{ id: 'user-1', email: 'alice@example.com' }];
    this.refreshTokens = [];
    this.habits = [
      {
        id: 'habit-1',
        userId: 'user-1',
        name: 'Read 20 pages',
        description: null,
        color: '#22c55e',
        icon: 'book-open',
        frequency: 'daily',
        targetStreak: 7,
        dailyTarget: 1,
        tags: ['mindset'],
        archived: false,
        createdAt: new Date('2026-03-01T10:00:00.000Z'),
        updatedAt: new Date('2026-03-01T10:00:00.000Z'),
        version: 1
      }
    ];
    this.checkins = [];
    this.tombstones = [];
    this.syncOpIds = new Set<string>();
  }

  user = {
    findUnique: async (args: { where: { id?: string; email?: string } }) => {
      const { id, email } = args.where;
      const found = this.users.find(
        (user) =>
          (typeof id === 'string' && user.id === id) ||
          (typeof email === 'string' && user.email === email)
      );
      return found ?? null;
    },
    create: async (args: { data: { email: string }; select: { id: true; email: true } }) => {
      const created = { id: `user-${this.users.length + 1}`, email: args.data.email };
      this.users.push(created);
      return created;
    }
  };

  refreshToken = {
    create: async (args: { data: { token: string; userId: string; expiresAt: Date } }) => {
      const record: RefreshTokenRecord = {
        token: args.data.token,
        userId: args.data.userId,
        expiresAt: args.data.expiresAt,
        revoked: false
      };
      this.refreshTokens.push(record);
      return record;
    },
    findUnique: async (args: { where: { token: string } }) => {
      return this.refreshTokens.find((token) => token.token === args.where.token) ?? null;
    },
    updateMany: async (args: { where: { token: string }; data: { revoked: boolean } }) => {
      let count = 0;
      this.refreshTokens = this.refreshTokens.map((token) => {
        if (token.token !== args.where.token) {return token;}
        count += 1;
        return { ...token, revoked: args.data.revoked };
      });
      return { count };
    }
  };

  habit = {
    findMany: async (args: { where: Record<string, unknown>; take: number }) => {
      const rows = this.habits
        .filter((habit) => this.matchesWhere(habit, args.where, 'updatedAt'))
        .sort((a, b) => this.compareByTimestampAndId(a.updatedAt, b.updatedAt, a.id, b.id));
      return rows.slice(0, args.take);
    },
    findUnique: async (args: { where: { id: string }; select?: { userId: true } }) => {
      const found = this.habits.find((habit) => habit.id === args.where.id);
      if (!found) {return null;}
      if (args.select?.userId) {
        return { userId: found.userId };
      }
      return found;
    },
    upsert: async (args: {
      where: { id: string };
      create: HabitRecord;
      update: Omit<HabitRecord, 'id' | 'userId' | 'createdAt'>;
    }) => {
      const index = this.habits.findIndex((habit) => habit.id === args.where.id);
      if (index === -1) {
        this.habits.push(args.create);
        return args.create;
      }
      const updated: HabitRecord = {
        ...this.habits[index],
        ...args.update
      };
      this.habits[index] = updated;
      return updated;
    },
    deleteMany: async (args: { where: { id?: string; userId: string } }) => {
      const before = this.habits.length;
      this.habits = this.habits.filter((habit) => {
        if (habit.userId !== args.where.userId) {return true;}
        if (args.where.id && habit.id !== args.where.id) {return true;}
        return false;
      });
      return { count: before - this.habits.length };
    }
  };

  checkin = {
    findMany: async (args: { where: Record<string, unknown>; take: number }) => {
      const rows = this.checkins
        .filter((checkin) => this.matchesWhere(checkin, args.where, 'updatedAt'))
        .sort((a, b) => this.compareByTimestampAndId(a.updatedAt, b.updatedAt, a.id, b.id));
      return rows.slice(0, args.take);
    },
    findFirst: async (args: { where: { habitId: string; date: Date; userId: string } }) => {
      return (
        this.checkins.find(
          (checkin) =>
            checkin.habitId === args.where.habitId &&
            checkin.userId === args.where.userId &&
            checkin.date.getTime() === args.where.date.getTime()
        ) ?? null
      );
    },
    upsert: async (args: {
      where: { habit_date_unique: { habitId: string; date: Date } };
      create: Omit<CheckinRecord, 'id'>;
      update: Pick<CheckinRecord, 'done' | 'count' | 'updatedAt' | 'version'>;
    }) => {
      const { habitId, date } = args.where.habit_date_unique;
      const index = this.checkins.findIndex(
        (checkin) => checkin.habitId === habitId && checkin.date.getTime() === date.getTime()
      );
      if (index === -1) {
        const created: CheckinRecord = { id: randomUUID(), ...args.create };
        this.checkins.push(created);
        return created;
      }
      const updated: CheckinRecord = {
        ...this.checkins[index],
        ...args.update
      };
      this.checkins[index] = updated;
      return updated;
    },
    deleteMany: async (args: { where: { habitId: string; date: Date; userId: string } }) => {
      const before = this.checkins.length;
      this.checkins = this.checkins.filter((checkin) => {
        if (checkin.userId !== args.where.userId) {return true;}
        if (checkin.habitId !== args.where.habitId) {return true;}
        if (checkin.date.getTime() !== args.where.date.getTime()) {return true;}
        return false;
      });
      return { count: before - this.checkins.length };
    }
  };

  tombstone = {
    findMany: async (args: { where: Record<string, unknown>; take: number }) => {
      const rows = this.tombstones
        .filter((tombstone) => this.matchesWhere(tombstone, args.where, 'deletedAt'))
        .sort((a, b) => this.compareByTimestampAndId(a.deletedAt, b.deletedAt, a.id, b.id));
      return rows.slice(0, args.take);
    },
    create: async (args: { data: Omit<TombstoneRecord, 'id' | 'deletedAt'> }) => {
      const record: TombstoneRecord = {
        id: randomUUID(),
        deletedAt: new Date(),
        ...args.data
      };
      this.tombstones.push(record);
      return record;
    }
  };

  syncOpLog = {
    createMany: async (args: { data: Array<{ opId: string }>; skipDuplicates: boolean }) => {
      let count = 0;
      for (const entry of args.data) {
        if (this.syncOpIds.has(entry.opId)) {
          if (!args.skipDuplicates) {
            throw { code: 'P2002' };
          }
          continue;
        }
        this.syncOpIds.add(entry.opId);
        count += 1;
      }

      return { count };
    }
  };

  async $transaction<T>(callback: (tx: InMemoryPrismaMock) => Promise<T>): Promise<T> {
    return callback(this);
  }

  private compareByTimestampAndId(aTime: Date, bTime: Date, aId: string, bId: string): number {
    const diff = aTime.getTime() - bTime.getTime();
    if (diff !== 0) {return diff;}
    return aId.localeCompare(bId);
  }

  private matchesWhere(
    row: { userId: string; id: string; updatedAt?: Date; deletedAt?: Date },
    where: Record<string, unknown>,
    field: 'updatedAt' | 'deletedAt'
  ): boolean {
    if (typeof where.userId === 'string' && row.userId !== where.userId) {return false;}
    const value = row[field];
    if (!(value instanceof Date)) {return false;}
    const clause = this.extractCursorClause(where);
    if (!clause) {return true;}

    if (this.matchesGreaterThanClause(value, clause.first[field])) {return true;}
    return this.matchesEqualTimestampAndId(value, row.id, clause.second, field);
  }

  private extractCursorClause(where: Record<string, unknown>): {
    first: Record<string, unknown>;
    second: Record<string, unknown>;
  } | null {
    const andClause = Array.isArray(where.AND) ? where.AND[0] : undefined;
    const orClause = andClause && typeof andClause === 'object'
      ? (andClause as { OR?: unknown }).OR
      : undefined;
    if (!Array.isArray(orClause) || orClause.length !== 2) {
      return null;
    }

    const [first, second] = orClause as Array<Record<string, unknown>>;
    return { first, second };
  }

  private matchesGreaterThanClause(value: Date, candidate: unknown): boolean {
    const gtDate = this.extractDate(candidate);
    return Boolean(gtDate && value.getTime() > gtDate.getTime());
  }

  private matchesEqualTimestampAndId(
    value: Date,
    rowId: string,
    second: Record<string, unknown>,
    field: 'updatedAt' | 'deletedAt'
  ): boolean {
    const secondField = second[field];
    const equalsDate = this.extractDate(
      typeof secondField === 'object' && secondField !== null
        ? (secondField as { equals?: unknown }).equals
        : undefined
    );
    const idGt = typeof second.id === 'object' && second.id !== null
      ? (second.id as { gt?: unknown }).gt
      : undefined;
    return Boolean(
      equalsDate &&
        value.getTime() === equalsDate.getTime() &&
        typeof idGt === 'string' &&
        rowId > idGt
    );
  }

  private extractDate(value: unknown): Date | null {
    if (typeof value === 'object' && value !== null && 'gt' in value) {
      const gt = (value as { gt?: unknown }).gt;
      return gt instanceof Date ? gt : null;
    }
    if (value instanceof Date) {return value;}
    return null;
  }
}
