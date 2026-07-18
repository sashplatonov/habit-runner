import type { HabitColor, HabitFrequency, HabitSchedule, HabitType } from '@habbit-runner/shared';

export type { HabitColor, HabitFrequency, HabitSchedule, HabitType } from '@habbit-runner/shared';

export interface Habit {
  id: string;
  name: string;
  description: string;
  color: HabitColor;
  icon: string;
  tags: string[];
  frequency: HabitFrequency;
  customDays?: number[]; // 0=Sun, 1=Mon, ... 6=Sat
  schedule?: HabitSchedule;
  targetStreak: number;
  dailyTarget: number;
  completions: Record<string, number>; // "YYYY-MM-DD" -> completion count
  freezeDays: string[];
  createdAt: string;
  updatedAt?: string;
  version?: number;
  archived: boolean;
  sortOrder: number;
  type: HabitType;
  reminderTime?: string;
  reminderEnabled?: boolean;
}

export interface HabitStats {
  completedDays: number;
  longestStreak: number;
}

export type AppView = 'dashboard' | 'detail' | 'add' | 'edit' | 'stats';
