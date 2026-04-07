import type { HabitColor, HabitFrequency, HabitSchedule } from '@habbit-runner/shared';

export type { HabitColor, HabitFrequency };

export interface Habit {
  id: string;
  name: string;
  description: string;
  color: HabitColor;
  icon: string;
  tags: string[];
  frequency: HabitFrequency;
  customDays?: number[];
  schedule?: HabitSchedule;
  targetStreak: number;
  dailyTarget: number;
  completions: Record<string, number>;
  freezeDays: string[];
  createdAt: string;
  updatedAt?: string;
  version?: number;
  archived: boolean;
  sortOrder: number;
  type: 'positive' | 'negative';
  reminderTime?: string;
  reminderEnabled?: boolean;
}

export interface HabitStats {
  totalDays: number;
  completedDays: number;
  currentStreak: number;
  longestStreak: number;
  completionRate: number;
  automatismScore: number;
  weeklyData: { week: string; count: number }[];
  monthlyData: { month: string; rate: number }[];
}

export type AppView = 'dashboard' | 'detail' | 'add' | 'edit' | 'stats';
