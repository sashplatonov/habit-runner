import type { LucideIcon } from 'lucide-react';
import {
  AlertTriangleIcon,
  CheckCircle2Icon,
  CalendarIcon,
  DumbbellIcon,
  FlameIcon,
  LightbulbIcon,
  SproutIcon,
  TargetIcon,
  TrendingUpIcon,
  TrophyIcon
} from 'lucide-react';

export type CardHint = { icon: LucideIcon; text: string };

export function getStreakHint(currentStreak: number, longestStreak: number): CardHint {
  if (currentStreak === 0) {
    return { icon: FlameIcon, text: 'Start today' };
  }
  if (currentStreak >= longestStreak && longestStreak > 0) {
    return { icon: TrophyIcon, text: 'Personal best!' };
  }
  return { icon: FlameIcon, text: `${longestStreak - currentStreak}d to record` };
}

export function getBestHint(longestStreak: number): CardHint {
  if (longestStreak >= 21) {
    return { icon: CheckCircle2Icon, text: 'Habit established' };
  }
  if (longestStreak >= 7) {
    return { icon: DumbbellIcon, text: 'Good foundation' };
  }
  return { icon: TargetIcon, text: 'Target: 7 days' };
}

export function getRateHint(habitAgeDays: number, completionRate: number): CardHint {
  if (habitAgeDays < 7) {
    return { icon: SproutIcon, text: 'Just started' };
  }
  if (habitAgeDays < 14) {
    return completionRate >= 60
      ? { icon: CheckCircle2Icon, text: 'Strong start!' }
      : { icon: DumbbellIcon, text: 'Keep building' };
  }
  if (completionRate >= 80) {
    return { icon: CheckCircle2Icon, text: 'Excellent' };
  }
  if (completionRate >= 60) {
    return { icon: LightbulbIcon, text: 'Aim for 80%+' };
  }
  if (completionRate >= 40) {
    return { icon: TrendingUpIcon, text: 'Room to grow' };
  }
  return { icon: AlertTriangleIcon, text: 'Needs focus' };
}

export function getRateColor(habitAgeDays: number, completionRate: number): string {
  if (habitAgeDays < 14) {
    return completionRate >= 60 ? 'text-accent' : 'text-accent-secondary';
  }
  if (completionRate >= 80) {return 'text-accent';}
  if (completionRate >= 50) {return 'text-accent-secondary';}
  return 'text-muted';
}

export function getTotalHint(completedDays: number): CardHint {
  if (completedDays >= 100) {
    return { icon: TrophyIcon, text: '100+ milestone!' };
  }
  return { icon: CalendarIcon, text: `${100 - completedDays} to 100` };
}

export function getHabitAgeDays(habitCreatedAt: string): number {
  return Math.floor(
    (Date.now() - new Date(habitCreatedAt).getTime()) / (1000 * 60 * 60 * 24)
  );
}

export function getRateWindowLabel(habitAgeDays: number): string {
  const rateWindowDays = Math.min(30, habitAgeDays);
  return rateWindowDays < 30 ? `${rateWindowDays}d` : '30 days';
}
