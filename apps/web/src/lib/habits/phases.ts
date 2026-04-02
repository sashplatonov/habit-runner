import { ActivityIcon, ShieldIcon, StarIcon, ZapIcon } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

export interface HabitPhase {
  id: 1 | 2 | 3 | 4;
  name: string;
  range: string;
  description: string;
  hint: string;
  minDays: number;
  maxDays: number | null;
  icon: LucideIcon;
}

export const HABIT_PHASES: HabitPhase[] = [
  {
    id: 1,
    name: 'Reinforcement',
    range: '1–21',
    description: 'Every day is critical',
    hint: 'Missing = serious setback',
    minDays: 1,
    maxDays: 21,
    icon: ShieldIcon
  },
  {
    id: 2,
    name: 'Momentum',
    range: '22–66',
    description: 'Getting easier, stay consistent',
    hint: '3 misses in a row = danger',
    minDays: 22,
    maxDays: 66,
    icon: ZapIcon
  },
  {
    id: 3,
    name: 'Automation',
    range: '67–99',
    description: 'Running on autopilot',
    hint: 'Occasional misses are fine',
    minDays: 67,
    maxDays: 99,
    icon: ActivityIcon
  },
  {
    id: 4,
    name: 'Identity',
    range: '100+',
    description: 'This is who you are',
    hint: 'Habit is part of your identity',
    minDays: 100,
    maxDays: null,
    icon: StarIcon
  }
];

export const PHASE_MILESTONES = [21, 66, 100] as const;

export function getHabitPhase(streak: number): HabitPhase {
  if (streak >= 100) { return HABIT_PHASES[3]; }
  if (streak >= 67) { return HABIT_PHASES[2]; }
  if (streak >= 22) { return HABIT_PHASES[1]; }
  return HABIT_PHASES[0];
}

export function isPhaseTransition(streak: number): boolean {
  return (PHASE_MILESTONES as readonly number[]).includes(streak);
}
