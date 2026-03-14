import type { HabitColor, HabitFrequency, HabitSchedule } from '@habbit-runner/shared';

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
  difficulty: 1 | 2 | 3 | 4 | 5;
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
