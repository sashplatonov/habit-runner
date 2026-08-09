import type { Habit } from '@/types/habit';
import type { CheckinState } from '$lib/stores/habits.storeHelpers';
import { calendarDateToCompletionKey } from '$lib/completionKey';

export type ShowcaseFixture = {
  habits: ShowcaseHabit[];
  checkins: CheckinState[];
  summary: { completed: number; total: number; streak: number; completionRate: number };
  week: ShowcaseDay[];
  conflict: { title: string; message: string; detail: string };
};

export type ShowcaseHabit = Habit & {
  category: string;
  progress: number;
  streak: number;
  accent: string;
  status: 'Complete' | 'In progress' | 'Next up';
};

export type ShowcaseDay = { label: string; date: string; completed: boolean; current?: boolean };

const demoUserId = 'showcase-demo';

function dateAtOffset(offset: number): string {
  const date = new Date();
  date.setDate(date.getDate() + offset);
  return date.toISOString().slice(0, 10);
}

function makeHabit(input: Pick<Habit, 'id' | 'name' | 'description' | 'color' | 'icon' | 'frequency' | 'schedule' | 'dailyTarget' | 'type' | 'tags'> & Partial<Pick<Habit, 'customDays' | 'targetStreak' | 'sortOrder'>>): Habit {
  const createdAt = new Date(Date.now() - 1000 * 60 * 60 * 24 * 45).toISOString();
  return {
    ...input,
    targetStreak: input.targetStreak ?? 14,
    sortOrder: input.sortOrder ?? 0,
    completions: {},
    freezeDays: [],
    createdAt,
    updatedAt: createdAt,
    version: 1,
    archived: false,
    reminderEnabled: false
  };
}

export function createPortfolioFixture(): ShowcaseFixture {
  const habits: ShowcaseHabit[] = [
    makeHabit({
      id: 'morning-pages',
      name: 'Morning pages',
      description: 'Write three pages before the day gets noisy.',
      color: 'green',
      icon: '✍️',
      frequency: 'daily',
      schedule: { type: 'daily' },
      dailyTarget: 1,
      type: 'positive',
      tags: ['focus', 'mindfulness'],
      sortOrder: 0
    }),
    makeHabit({
      id: 'walk-outside',
      name: 'Walk outside',
      description: 'Get daylight and a little movement between meetings.',
      color: 'blue',
      icon: '🌿',
      frequency: 'weekdays',
      schedule: { type: 'weekly_days', weekdays: [1, 2, 3, 4, 5] },
      dailyTarget: 1,
      type: 'positive',
      tags: ['energy'],
      sortOrder: 1
    }),
    makeHabit({
      id: 'read-chapter',
      name: 'Read one chapter',
      description: 'Keep a small, steady learning loop.',
      color: 'orange',
      icon: '📚',
      frequency: 'daily',
      schedule: { type: 'daily' },
      dailyTarget: 1,
      type: 'positive',
      tags: ['learning'],
      sortOrder: 2
    }),
    makeHabit({
      id: 'screen-free-evening',
      name: 'Screen-free evening',
      description: 'A negative habit: keep the last hour offline.',
      color: 'purple',
      icon: '🌙',
      frequency: 'daily',
      schedule: { type: 'daily' },
      dailyTarget: 2,
      type: 'negative',
      tags: ['recovery'],
      sortOrder: 3
    })
  ].map((habit, index) => ({
    ...habit,
    category: habit.tags[0] ?? 'Focus',
    progress: [100, 60, 25, 80][index],
    streak: [9, 6, 4, 3][index],
    accent: ['#23835d', '#4e63d8', '#c06a3d', '#805ad5'][index],
    status: ['Complete', 'In progress', 'Next up', 'In progress'][index] as ShowcaseHabit['status']
  }));

  const history = [
    { habitId: 'morning-pages', days: 9, count: 1 },
    { habitId: 'walk-outside', days: 6, count: 1 },
    { habitId: 'read-chapter', days: 4, count: 1 },
    { habitId: 'screen-free-evening', days: 3, count: 2 }
  ];
  const checkins: CheckinState[] = history.flatMap(({ habitId, days, count }) => Array.from({ length: days }, (_, index) => {
    const date = dateAtOffset(-(index + 1));
    return {
      id: `${habitId}-${date}`,
      userId: demoUserId,
      habitId,
      date: calendarDateToCompletionKey(date),
      done: true,
      count,
      updatedAt: new Date().toISOString(),
      version: 1
    };
  }));

  return {
    habits,
    checkins,
    summary: { completed: 2, total: habits.length, streak: 9, completionRate: 78 },
    week: [
      { label: 'Mon', date: '12', completed: true }, { label: 'Tue', date: '13', completed: true },
      { label: 'Wed', date: '14', completed: true }, { label: 'Thu', date: '15', completed: true },
      { label: 'Fri', date: '16', completed: false, current: true }, { label: 'Sat', date: '17', completed: false },
      { label: 'Sun', date: '18', completed: false }
    ],
    conflict: {
      title: 'A change needs your attention',
      message: 'This item changed elsewhere. Refresh and try again.',
      detail: 'Optimistic versioning keeps two sessions from silently overwriting each other.'
    }
  };
}

export const portfolioFixture = createPortfolioFixture();
