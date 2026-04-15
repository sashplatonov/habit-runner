import { Activity, Shield, Star, Zap } from 'lucide-svelte';

export interface HabitPhase {
  id: 1 | 2 | 3 | 4;
  name: string;
  range: string;
  description: string;
  hint: string;
  minDays: number;
  maxDays: number | null;
  icon: typeof Shield;
}

export const HABIT_PHASES: HabitPhase[] = [
  {
    id: 1,
    name: 'Fragile',
    range: '1–21',
    description: 'Every day is critical',
    hint: 'Missing = serious setback',
    minDays: 1,
    maxDays: 21,
    icon: Shield
  },
  {
    id: 2,
    name: 'Growing',
    range: '22–66',
    description: 'Momentum is forming',
    hint: '3 misses in a row = danger',
    minDays: 22,
    maxDays: 66,
    icon: Zap
  },
  {
    id: 3,
    name: 'Established',
    range: '67–99',
    description: 'Running with less friction',
    hint: 'Occasional misses are fine',
    minDays: 67,
    maxDays: 99,
    icon: Activity
  },
  {
    id: 4,
    name: 'Infallible',
    range: '100+',
    description: 'Habit is part of your identity',
    hint: 'Habit runs on autopilot',
    minDays: 100,
    maxDays: null,
    icon: Star
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
