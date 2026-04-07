import type { HabitColor, HabitFrequency } from '$lib/types/habit';

export const COLORS: {
  value: HabitColor;
  label: string;
  hex: string;
}[] = [
  { value: 'blue', label: 'Blue', hex: '#00d4ff' },
  { value: 'green', label: 'Green', hex: '#00ff88' },
  { value: 'purple', label: 'Purple', hex: '#a855f7' },
  { value: 'orange', label: 'Orange', hex: '#f97316' },
  { value: 'red', label: 'Red', hex: '#ef4444' },
  { value: 'cyan', label: 'Cyan', hex: '#22d3ee' }
];

export const FREQUENCIES: {
  value: HabitFrequency;
  label: string;
  desc: string;
}[] = [
  { value: 'daily', label: 'Daily', desc: 'Every day' },
  { value: 'weekdays', label: 'Weekdays', desc: 'Mon-Fri' },
  { value: 'weekends', label: 'Weekends', desc: 'Sat-Sun' },
  { value: 'custom', label: 'Custom', desc: 'Choose days' }
];

export const ICONS = [
  '⚡', '🏃', '📖', '🧘', '💪',
  '🎯', '💻', '🎨', '🎵', '🌱',
  '💧', '🍎', '✍️', '🧪', '🔬'
];

export const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export const TARGET_STREAK_OPTIONS = [7, 14, 21, 30, 60, 90, 180, 365];
export const DAILY_TARGET_OPTIONS = [1, 2, 3, 4, 5];

export const SUGGESTED_TAGS = [
  'health', 'fitness', 'productivity', 'learning', 'wellness',
  'focus', 'growth', 'mental', 'creative', 'social'
];
