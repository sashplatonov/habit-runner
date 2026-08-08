import type { HabitColor, HabitFrequency, HabitSchedule, HabitType } from './habit.js';

export interface HabitCreateRequestDto {
  id: string;
  name: string;
  description?: string | null;
  color: HabitColor;
  icon: string;
  frequency: HabitFrequency;
  customDays?: number[];
  schedule?: HabitSchedule | null;
  targetStreak: number;
  dailyTarget: number;
  tags?: string[];
  archived?: boolean;
  sortOrder?: number;
  reminderTime?: string | null;
  reminderEnabled?: boolean;
  type?: HabitType;
  freezeDays?: string[];
  version?: number;
}

export interface HabitUpdateRequestDto {
  name?: string;
  description?: string | null;
  color?: HabitColor;
  icon?: string;
  frequency?: HabitFrequency;
  customDays?: number[];
  schedule?: HabitSchedule | null;
  targetStreak?: number;
  dailyTarget?: number;
  tags?: string[];
  archived?: boolean;
  sortOrder?: number;
  reminderTime?: string | null;
  reminderEnabled?: boolean;
  type?: HabitType;
  freezeDays?: string[];
}

export interface HabitStatusUpdateRequestDto {
  archived: boolean;
  version?: number;
}

export interface HabitResponseDto {
  id: string;
  name: string;
  description?: string | null;
  color: HabitColor;
  icon: string;
  frequency: HabitFrequency;
  customDays?: number[];
  schedule?: HabitSchedule | null;
  targetStreak: number;
  dailyTarget: number;
  tags?: string[];
  archived: boolean;
  createdAt: string;
  updatedAt: string;
  version: number;
  sortOrder: number;
  reminderTime?: string | null;
  reminderEnabled: boolean;
  type: HabitType;
  freezeDays?: string[];
}
