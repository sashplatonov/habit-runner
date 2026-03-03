export type HabitColor = 'blue' | 'green' | 'purple' | 'orange' | 'red' | 'cyan';
export type HabitFrequency = 'daily' | 'weekdays' | 'weekends' | 'custom';

export interface Habit {
  id: string;
  name: string;
  description: string;
  color: HabitColor;
  icon: string;
  tags: string[];
  frequency: HabitFrequency;
  customDays?: number[]; // 0=Sun, 1=Mon, ... 6=Sat
  targetStreak: number;
  completions: Record<string, boolean>; // "YYYY-MM-DD" -> true
  createdAt: string;
  archived: boolean;
}

export interface HabitStats {
  totalDays: number;
  completedDays: number;
  currentStreak: number;
  longestStreak: number;
  completionRate: number;
  weeklyData: {week: string;count: number;}[];
  monthlyData: {month: string;rate: number;}[];
}

export type AppView = 'dashboard' | 'detail' | 'add' | 'edit' | 'stats';